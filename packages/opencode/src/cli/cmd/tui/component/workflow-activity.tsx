import { RGBA } from "@opentui/core"
import { createEffect, createMemo, createSignal, For, onCleanup } from "solid-js"
import { useTheme } from "../context/theme"
import { useKV } from "../context/kv"
import { createColors } from "../ui/spinner"

const BAR_COUNT = 22
const BAR_GLYPH = "/"
const ACTIVE_INTERVAL = 100
const COMPLETE_INTERVAL = 126
const COMPLETE_TRAIL = 8
const COMPLETE_TOTAL = BAR_COUNT + COMPLETE_TRAIL * 2

function alpha(color: RGBA, value: number) {
  return RGBA.fromValues(color.r, color.g, color.b, value)
}

function boost(color: RGBA, factor: number) {
  return RGBA.fromValues(
    Math.min(1, color.r * factor),
    Math.min(1, color.g * factor),
    Math.min(1, color.b * factor),
    color.a,
  )
}

export function WorkflowActivity(props: { state: "active" | "pending" | "paused" | "idle"; percent: number; animate?: boolean }) {
  const { theme } = useTheme()
  const kv = useKV()
  const animate = createMemo(() => kv.get("animations_enabled", true) && props.animate !== false && props.state === "active")
  const [frame, setFrame] = createSignal(0)
  const percent = createMemo(() => Math.max(0, Math.min(100, Math.round(props.percent))))
  const done = createMemo(() => Math.round((percent() / 100) * BAR_COUNT))
  const complete = createMemo(() => props.state === "idle" && percent() >= 100)
  const pulse = createMemo(() => kv.get("animations_enabled", true) && complete())
  const moving = createMemo(() => animate() || pulse())
  const activeSpan = createMemo(() => Math.max(1, done()))
  const activeTrail = createMemo(() => Math.max(2, Math.min(9, activeSpan())))
  const activeDef = createMemo(() => ({
    total: activeSpan(),
    color: createColors({
      color: theme.primary,
      style: "slash",
      width: activeSpan(),
      direction: "forward",
      trailSteps: activeTrail(),
      inactiveFactor: 0.1,
      minAlpha: 0.06,
      holdStart: 0,
      holdEnd: 0,
    }),
  }))
  const boxBg = createMemo(() => {
    return theme.backgroundElement
  })
  const boxBorder = createMemo(() => {
    if (complete()) return theme.success
    if (props.state === "active") return theme.borderActive
    if (props.state === "paused") return theme.error
    if (props.state === "pending") return theme.borderActive
    return theme.border
  })
  const boxFg = createMemo(() => {
    if (complete()) return theme.success
    if (props.state === "active") return theme.text
    if (props.state === "paused") return theme.error
    if (props.state === "pending") return theme.warning
    return theme.textMuted
  })
  const status = createMemo(() => {
    if (complete()) return "done"
    if (props.state === "active") return "active"
    if (props.state === "paused") return "paused"
    if (props.state === "pending") return "pending"
    return "idle"
  })
  const bars = createMemo(() => {
    if (complete()) {
      const center = (frame() % COMPLETE_TOTAL) - COMPLETE_TRAIL
      return Array.from({ length: BAR_COUNT }, (_, i) => {
        const dist = Math.abs(i - center)
        const glow = Math.max(0, 1 - dist / COMPLETE_TRAIL)
        if (glow > 0.96) {
          return {
            glyph: BAR_GLYPH,
            color: boost(theme.success, 1.18),
          }
        }
        return {
          glyph: BAR_GLYPH,
          color: alpha(theme.success, 0.38 + glow * 0.58),
        }
      })
    }
    if (props.state === "idle") {
      return Array.from({ length: BAR_COUNT }, () => ({
        glyph: BAR_GLYPH,
        color: alpha(theme.borderSubtle, 0.55),
      }))
    }
    if (props.state === "paused") {
      return Array.from({ length: BAR_COUNT }, (_, i) => ({
        glyph: BAR_GLYPH,
        color: i < done() ? alpha(theme.error, 0.62) : alpha(theme.borderSubtle, 0.3),
      }))
    }
    if (props.state === "pending") {
      return Array.from({ length: BAR_COUNT }, (_, i) => ({
        glyph: BAR_GLYPH,
        color: i < done() ? alpha(theme.warning, 0.4) : alpha(theme.borderSubtle, 0.28),
      }))
    }

    const def = activeDef()
    const frameIndex = frame() % def.total
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      if (i < def.total) {
        return {
          glyph: BAR_GLYPH,
          color: def.color(frameIndex, i, def.total, def.total),
        }
      }
      return {
        glyph: BAR_GLYPH,
        color: alpha(theme.borderSubtle, 0.18),
      }
    })
  })

  createEffect(() => {
    if (!moving()) {
      setFrame(0)
      return
    }
    const interval = complete() ? COMPLETE_INTERVAL : ACTIVE_INTERVAL
    const total = complete() ? COMPLETE_TOTAL : activeDef().total
    const timer = setInterval(() => setFrame((value) => (value + 1) % total), interval)
    onCleanup(() => clearInterval(timer))
  })

  return (
    <box
      flexDirection="row"
      alignItems="center"
      gap={1}
      backgroundColor={boxBg()}
      border={["top", "bottom", "left", "right"]}
      borderColor={boxBorder()}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
      minWidth={1}
    >
      <box flexGrow={1} minWidth={1}>
        <box flexDirection="row" alignItems="center" gap={0} width="100%" minWidth={1}>
          <For each={bars()}>
            {(item) => (
              <text fg={item.color} wrapMode="none">
                {item.glyph}
              </text>
            )}
          </For>
        </box>
      </box>
      <box flexDirection="row" alignItems="center" gap={1} flexShrink={0}>
        <text fg={complete() ? theme.success : props.state === "paused" ? theme.error : theme.textMuted} bg={boxBg()} wrapMode="none" flexShrink={0}>
          {`${percent()}%`}
        </text>
        <text fg={theme.textMuted} bg={boxBg()} wrapMode="none" flexShrink={0}>
          •
        </text>
        <text fg={boxFg()} bg={boxBg()} wrapMode="none" flexShrink={0}>
          {status()}
        </text>
      </box>
    </box>
  )
}
