import optimist from "optimist"
import { debug } from 'util'

const d = debug('@app/options')

export interface Options {
    source_addr?: string
    source_port: number

    target_url: string

    retry_interval: number
    retry_times: number
}

export function getUsage(cmd: string) {
    return `${cmd} [--retry_interval <number>] [--retry_times <number>] <[source_addr:]source_port> <target_url>`
}

export async function getOptions(): Promise<Options> {
    const argv = optimist.argv

    const [source = '', target = ''] = (argv._ as any[]).map(x => '' + x)
    if (source === '') {
        throw new ArgumentsError('The source endpoint is not specified.')
    }

    const i = source.indexOf(':')
    const [source_addr, source_port] = i >= 0
        ? [source.slice(0, i), parseInt(source.slice(i + 1), 10)]
        : ['', parseInt(source, 10)]
    if (isNaN(source_port)) {
        throw new ArgumentsError('Invalid source endpoint: ' + source)
    }

    if (target === '') {
        throw new ArgumentsError('The target websocket url is not specified.')
    }

    const target_url = /^(wss?|https?):\/\//.test(target)
        ? target
        : `ws://${target}`

    const { retry_interval, retry_times } = argv
    const result = {
        source_addr,
        source_port,
        target_url,
        retry_interval: typeof retry_interval === 'number' ? retry_interval : 5,
        retry_times: typeof retry_times === 'number' ? retry_times : 5,
    }

    d('resolved options: %o', result)
    return result
}

export class ArgumentsError extends Error {

}
