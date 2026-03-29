import { TextAttributes } from "@opentui/core"
import { Show, createMemo } from "solid-js"
import "opentui-spinner/solid"

import { useKV } from "../context/kv"
import { useTheme } from "../context/theme"

const activeFrames = ["◜", "◠", "◝", "◞", "◡", "◟"]
const pendingFrames = ["·", "•", "●", "•"]

function label(status: string) {
  if (status === "completed") return "done"
  if (status === "in_progress") return "active"
  if (status === "paused") return "paused"
  if (status === "pending") return "queued"
  return status.replaceAll("_", " ")
}

function symbol(status: string) {
  if (status === "completed") return "✓"
  if (status === "paused") return "‖"
  if (status === "pending") return "·"
  return "?"
}

export function TodoStatus(props: { status: string; compact?: boolean }) {
  const { theme } = useTheme()
  const kv = useKV()

  const done = createMemo(() => props.status === "completed")
  const active = createMemo(() => props.status === "in_progress")
  const paused = createMemo(() => props.status === "paused")
  const wait = createMemo(() => props.status === "pending")
  const animate = createMemo(() => kv.get("animations_enabled", true))
  const tone = createMemo(() => {
    if (done()) return theme.success
    if (active()) return theme.warning
    if (paused()) return theme.warning
    if (wait()) return theme.textMuted
    return theme.textMuted
  })
  const frame = createMemo(() => {
    if (done()) return theme.success
    if (active()) return theme.warning
    if (paused()) return theme.warning
    if (wait()) return theme.borderSubtle
    return theme.borderSubtle
  })
  const text = createMemo(() => label(props.status))

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <box flexDirection="row" alignItems="center" gap={0}>
        <text fg={frame()} attributes={TextAttributes.BOLD} wrapMode="none">
          [
        </text>
        <Show
          when={active() && animate()}
          fallback={
            <Show
              when={wait() && animate()}
              fallback={
                <text fg={tone()} attributes={done() ? TextAttributes.BOLD : undefined} wrapMode="none">
                  {symbol(props.status)}
                </text>
              }
            >
              <spinner frames={pendingFrames} interval={180} color={tone()} />
            </Show>
          }
        >
          <spinner frames={activeFrames} interval={90} color={tone()} />
        </Show>
        <text fg={frame()} attributes={TextAttributes.BOLD} wrapMode="none">
          ]
        </text>
      </box>
      <Show when={!props.compact}>
        <text fg={tone()} attributes={done() || active() || paused() ? TextAttributes.BOLD : undefined} wrapMode="none">
          {text()}
        </text>
      </Show>
    </box>
  )
}
