import type { KiloClient } from "@kilocode/sdk/v2/client"

type Level = "debug" | "info" | "error" | "warn"
type Extra = Record<string, unknown>

const state = {
  seq: 0,
  start: performance.now(),
}

function ms(input: number) {
  return Math.round(input)
}

function err(input: unknown) {
  if (input instanceof Error) return input.message
  return String(input)
}

function write(input: {
  sdk?: KiloClient
  message: string
  level?: Level
  extra?: Extra
}) {
  const level = input.level ?? "info"
  const extra = {
    seq: ++state.seq,
    since: ms(performance.now() - state.start),
    ...input.extra,
  }

  if (!input.sdk) {
    console[level === "error" ? "error" : "info"]("[startup.app]", input.message, extra)
    return
  }

  void input.sdk.app
    .log({
      service: "startup.app",
      level,
      message: input.message,
      extra,
    })
    .catch(() => {
      console[level === "error" ? "error" : "info"]("[startup.app]", input.message, extra)
    })
}

export function markStartup(input: {
  sdk?: KiloClient
  message: string
  level?: Level
  extra?: Extra
}) {
  write(input)
}

export async function traceStartup<T>(input: {
  sdk?: KiloClient
  message: string
  extra?: Extra
  fn: () => Promise<T> | T
}) {
  const start = performance.now()
  try {
    const result = await input.fn()
    write({
      sdk: input.sdk,
      message: input.message,
      extra: {
        duration: ms(performance.now() - start),
        ...input.extra,
      },
    })
    return result
  } catch (error) {
    write({
      sdk: input.sdk,
      message: input.message,
      level: "error",
      extra: {
        duration: ms(performance.now() - start),
        error: err(error),
        ...input.extra,
      },
    })
    throw error
  }
}
