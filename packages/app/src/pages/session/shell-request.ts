const state = new Map<string, AbortController>()

export function startShellRequest(sessionID: string, abort: AbortController) {
  state.set(sessionID, abort)
}

export function clearShellRequest(sessionID: string, abort?: AbortController) {
  const current = state.get(sessionID)
  if (!current) return
  if (abort && current !== abort) return
  state.delete(sessionID)
}
