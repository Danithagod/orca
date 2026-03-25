import { Log } from "@/util/log"

type Extra = Record<string, unknown>

export namespace StartupTrace {
  const log = Log.create({ service: "startup" })

  function ms(input: number) {
    return Math.round(input)
  }

  function err(input: unknown) {
    if (input instanceof Error) return input.message
    return String(input)
  }

  export function info(message: string, extra?: Extra) {
    log.info(message, extra)
  }

  export async function time<T>(message: string, input: { extra?: Extra; fn: () => Promise<T> | T }) {
    const start = performance.now()
    try {
      const result = await input.fn()
      log.info(message, {
        duration: ms(performance.now() - start),
        ...input.extra,
      })
      return result
    } catch (error) {
      log.error(message, {
        duration: ms(performance.now() - start),
        error: err(error),
        ...input.extra,
      })
      throw error
    }
  }

  export function start(message: string, extra?: Extra) {
    const start = performance.now()
    const done = { value: false }
    return {
      stop(next?: Extra) {
        if (done.value) return
        done.value = true
        log.info(message, {
          duration: ms(performance.now() - start),
          ...extra,
          ...next,
        })
      },
      fail(error: unknown, next?: Extra) {
        if (done.value) return
        done.value = true
        log.error(message, {
          duration: ms(performance.now() - start),
          error: err(error),
          ...extra,
          ...next,
        })
      },
    }
  }
}
