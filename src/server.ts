import EventEmitter from 'events'
import { createServer, type Server as TCPServer } from 'net'
import { debug, promisify } from 'util'
import { Client } from './client'

const d = debug('@app/server')

export class Server extends EventEmitter<{
    connect: [client: Client]
}> {
    readonly desc: string

    readonly addr: string
    constructor(
        readonly port: number,
        addr?: string
    ) {
        super({
            captureRejections: true
        })

        addr = addr || '0.0.0.0'

        this.addr = addr
        this.desc = `tcp://${addr}:${port}`
    }

    private server: TCPServer | undefined
    async start() {
        const server = createServer((socket) => {
            const desc = `${socket.remoteAddress}:${socket.remotePort}`
            d('[%s] connected.', desc)
            socket.on('close', () => {
                d('[%s] disconnected.', desc)
            })

            const client = new Client(socket, desc)
            this.emit('connect', client)
        })

        await new Promise<void>((resolve, reject) => {
            const { addr, port } = this
            server.once('error', (err) => {
                reject(err)
            })

            server.listen(port, addr, () => {
                d('[%s] listening...', this.desc)
                resolve()
            })
        })
        this.server = server

        return this
    }

    async stop() {
        const { desc, server } = this
        if (server != null) {
            const close = promisify(server.close).bind(server)
            await close()

            d('[%s] stopping...', desc)
        }
    }
}
