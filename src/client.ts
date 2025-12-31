import type { Socket } from 'net'
import { debug } from 'util'
// import { WebSocket } from 'ws'
import { delay, timeout } from './utils/promise'

const d = debug('@app/client')

export class Client {
    constructor(
        readonly socket: Socket,
        readonly desc: string
    ) {
    }

    async forward(url: string, retry_interval: number, retry_times: number) {
        let ws: WebSocket
        while (true) {
            try {
                ws = await connect(url, 2000)
                break
            } catch (err: any) {
                if (--retry_times > 0) {
                    d('[%s] connecting failed: %s, retrying in %d seconds',
                        url,
                        err.message ?? err,
                        retry_interval
                    )
                    await delay(retry_interval * 1000)
                    continue
                }

                throw new Error('Failed to connect: ' + url + ` (${err.message ?? err})`)
            }
        }

        const { socket } = this
        socket.on('close', (err) => {
            d('[%s] closed: %s', this.desc, err ? socket.errored?.message : '-')
            ws.close()
        })
        socket.on('data', (data) => {
            d('[%s] => [%s]: %d bytes', this.desc, url, data.length)
            ws.send(data)
        })

        ws.addEventListener('close', (e) => {
            d('[%s] closed: %s', url, e.reason ?? '-')
            socket.destroy()
        })
        ws.addEventListener('message', async (e) => {
            const { data } = e
            const buffer = isBlob(data)
                ? await data.arrayBuffer()
                : data as ArrayBuffer

            d('[%s] <= [%s]: %d bytes', this.desc, url, buffer.byteLength)
            socket.write(Buffer.from(buffer))
        })
        ws.addEventListener('error', (e) => {
            console.error((e as ErrorEvent).error)
        })

        return this
    }

    close(err?: Error) {
        this.socket.destroy(err)
    }
}

async function connect(url: string, timeoutMs: number) {
    return timeout(
        new Promise<WebSocket>((resolve, reject) => {
            const ws = new WebSocket(url)
            ws.addEventListener('open', () => resolve(ws))
            ws.addEventListener('error', (e) => reject((e as ErrorEvent).error))
        }),
        timeoutMs
    )
}

function isBlob(x: any): x is Blob {
    return x != null &&
        typeof (x as Blob).stream === 'function'
}
