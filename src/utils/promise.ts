export async function delay(ms: number, abort?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), ms)
        abort?.addEventListener('abort', () => {
            clearTimeout(timer)

            const { reason } = abort
            reason instanceof Error
                ? reject(reason) : resolve()
        })
    })
}
export async function timeout<T>(promise: Promise<T>, ms: number) {
    const ctrl = new AbortController()
    return Promise.race([
        promise.then((res) => {
            ctrl.abort()
            return res
        }),
        delay(ms, ctrl.signal).then(() => {
            throw new TimeoutError(ms)
        })
    ]) as Promise<T>
}

export class TimeoutError extends Error {
    constructor(ms: number) {
        super(`Timeout elapsed: ${ms}ms`)
    }
}
