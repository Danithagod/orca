import { Colors } from "../theme/colors"
import { renderPulse } from "../renderer/animation"

export type IndicatorStatus = "idle" | "thinking" | "active" | "error" | "success"

export interface StatusIndicatorProps {
  status: IndicatorStatus
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

const STATUS_ICONS: Record<IndicatorStatus, string> = {
  idle: "○",
  thinking: "◎",
  active: "◉",
  error: "✗",
  success: "✓",
}

const STATUS_COLORS: Record<IndicatorStatus, Colors.ColorType> = {
  idle: "textMuted",
  thinking: "accent",
  active: "primaryLight",
  error: "error",
  success: "success",
}

const SIZE_SCALE: Record<"sm" | "md" | "lg", number> = {
  sm: 1,
  md: 1.2,
  lg: 1.5,
}

export const STATUS_CONFIG = {
  icons: STATUS_ICONS,
  colors: STATUS_COLORS,
}

export function render(props: StatusIndicatorProps): string {
  const { status, size = "md", animated = true } = props

  if (animated && status === "thinking") {
    return Colors.apply(renderPulse(), STATUS_COLORS[status])
  }

  const icon = STATUS_ICONS[status]
  return Colors.apply(icon, STATUS_COLORS[status])
}

export namespace StatusIndicator {
  export function render(props: StatusIndicatorProps): string {
    return render(props)
  }

  export function icon(status: IndicatorStatus): string {
    return STATUS_ICONS[status]
  }

  export function color(status: IndicatorStatus): Colors.ColorType {
    return STATUS_COLORS[status]
  }

  export function scale(size: "sm" | "md" | "lg"): number {
    return SIZE_SCALE[size]
  }
}
