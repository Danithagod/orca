import { Locale } from "@/util/locale"

const MAX_LINES = 6
const MAX_CHARS = 700

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function compactSubagentText(text: string) {
  const input = text.trim()
  if (!input) return "No summary returned."

  const out: string[] = []
  let size = 0

  for (const line of lines(input)) {
    const next = Locale.truncate(line, 160)
    const extra = next.length + (out.length > 0 ? 1 : 0)
    if (out.length >= MAX_LINES) break
    if (size + extra > MAX_CHARS) break
    out.push(next)
    size += extra
  }

  if (out.length === 0) return Locale.truncate(input.replace(/\s+/g, " "), 160)
  const summary = out.join("\n")
  if (summary.length >= input.length) return summary
  return `${summary}\n…`
}

export function formatSubagentOutput(input: {
  taskId?: string
  sessionId: string
  agent?: string
  status?: string
  summary: string
}) {
  const out = [] as string[]
  if (input.taskId) out.push(`task_id: ${input.taskId}`)
  out.push(`session_id: ${input.sessionId}`)
  if (input.agent) out.push(`agent: ${input.agent}`)
  out.push(`status: ${input.status ?? "completed"}`)
  out.push("")
  out.push("<summary>")
  out.push(input.summary)
  out.push("</summary>")
  return out.join("\n")
}
