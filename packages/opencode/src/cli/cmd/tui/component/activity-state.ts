export function isInterruptedError(err?: string) {
  if (!err) return false
  return /aborted|interrupted/i.test(err)
}

export function isPausedTool(part: { state: { status: string; error?: string } }) {
  if (part.state.status !== "error") return false
  return isInterruptedError(part.state.error)
}

export function normalizeTodoStatus(status: string, active: boolean) {
  if (status === "in_progress" && !active) return "paused"
  return status
}
