import { getOptions, getUsage } from './options'
import { Server } from './server'

async function main() {
    const options = await getOptions()
        .catch((err) => {
            console.error(
                'Error:', err.message,
                '\n\nUsage:', getUsage(
                    // replacing in compile time
                    process.env.COMMAND_NAME || '$0'
                ), '\n'
            )
            process.exit(1)
        })

    const {
        source_addr: addr,
        source_port: port,
        target_url: url,
        retry_interval,
        retry_times,
    } = options

    const server = new Server(port, addr)
    server.on('connect', (client) => {
        client.forward(url, retry_interval, retry_times)
            .catch((err) => {
                console.error('Error:', err.message ?? err)
                client.close()
            })
    })

    server.start()
        .catch((err) => {
            console.error('Error:', err.message ?? err)
            process.exit(1)
        })

    let stopping = false
    process.on('SIGINT', () => {
        if (stopping) {
            process.exit(1)
        }

        stopping = true
        server.stop()
    })
}

main()
