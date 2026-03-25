import { Colors } from "../theme/colors"
import { applyGradient } from "../renderer/gradient"

export type ProgressStyle = "solid" | "gradient" | "segments"

export interface ProgressBarProps {
  percent: number
  label?: string
  width?: number
  style?: ProgressStyle
}

const DEFAULT_WIDTH = 30

const SOLID_FILL = "█"
const SOLID_EMPTY = "░"
const SEGMENT_FILL = "▓"
const SEGMENT_EMPTY = "░"

export function render(props: ProgressBarProps): string {
  const { percent, label, width = DEFAULT_WIDTH, style = "gradient" } = props

  const clampedPercent = Math.max(0, Math.min(100, percent))
  const filled = Math.round((clampedPercent / 100) * width)
  const empty = width - filled

  const fillChar = style === "segments" ? SEGMENT_FILL : SOLID_FILL
  const emptyChar = style === "segments" ? SEGMENT_EMPTY : SOLID_EMPTY

  let bar: string
  if (style === "gradient") {
    bar = applyGradient(fillChar.repeat(filled), clampedPercent) + emptyChar.repeat(empty)
  } else {
    const color =
      clampedPercent < 30
        ? Colors.apply(fillChar, "error")
        : clampedPercent < 70
          ? Colors.apply(fillChar, "warning")
          : Colors.apply(fillChar, "success")
    bar = color + fillChar.repeat(filled) + Colors.apply(emptyChar, "textMuted") + Colors.reset
  }

  const labelStr = label ? ` ${label}` : ""
  const percentStr = `${Math.round(clampedPercent)}%`

  return `[${bar}]${labelStr} ${percentStr}`
}

export function renderSegmented(props: ProgressBarProps): string {
  return render({ ...props, style: "segments" })
}

export function renderWithTime(props: ProgressBarProps, elapsed: string, remaining?: string): string {
  const bar = render(props)
  const timeInfo = remaining
    ? ` ${Colors.apply(elapsed, "textMuted")} / ${Colors.apply(remaining, "textMuted")}`
    : ` ${Colors.apply(elapsed, "textMuted")}`
  return bar + timeInfo
}

export namespace ProgressBar {
  export function render(props: ProgressBarProps): string {
    return render(props)
  }

  export function segmented(props: ProgressBarProps): string {
    return renderSegmented(props)
  }

  export function withTime(props: ProgressBarProps, elapsed: string, remaining?: string): string {
    return renderWithTime(props, elapsed, remaining)
  }
}
