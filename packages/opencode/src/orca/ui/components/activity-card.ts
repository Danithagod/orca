import { Colors } from "../theme/colors"
import { createBoxWithTitle, BOX_CHARS } from "../renderer/box"
import { StatusIndicator, STATUS_CONFIG } from "./status-indicator"

export type ActivityStatus = "pending" | "active" | "completed" | "error" | "warning"

export interface ActivityCardProps {
  title: string
  status: ActivityStatus
  content: string
  timestamp: Date
  duration?: number
  icon?: string
  collapsible?: boolean
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function getStatusLabel(status: ActivityStatus): string {
  switch (status) {
    case "pending":
      return "Pending"
    case "active":
      return "Active"
    case "completed":
      return "Complete"
    case "error":
      return "Error"
    case "warning":
      return "Warning"
  }
}

function getStatusColor(status: ActivityStatus): Colors.ColorType {
  switch (status) {
    case "pending":
      return "textMuted"
    case "active":
      return "accent"
    case "completed":
      return "success"
    case "error":
      return "error"
    case "warning":
      return "warning"
  }
}

function mapStatusToIndicator(status: ActivityStatus): "idle" | "thinking" | "active" | "error" | "success" {
  switch (status) {
    case "pending":
      return "idle"
    case "active":
      return "active"
    case "completed":
      return "success"
    case "error":
      return "error"
    case "warning":
      return "thinking"
  }
}

export function renderActivityCard(props: ActivityCardProps): string[] {
  const { title, status, content, timestamp, duration } = props

  const indicatorStatus = mapStatusToIndicator(status)
  const statusIndicator = StatusIndicator.render({ status: indicatorStatus, size: "sm" })
  const statusLabel = getStatusLabel(status)
  const statusColor = getStatusColor(status)

  const timeStr = formatTime(timestamp)

  const lines: string[] = []
  lines.push(`  ${statusIndicator} ${Colors.apply(statusLabel, statusColor)}    ${Colors.apply(title, "textPrimary")}`)
  lines.push(`  ${BOX_CHARS.rounded.horizontal.repeat(50)}`)
  lines.push(`  ${content}`)
  lines.push(`  ${BOX_CHARS.rounded.horizontal.repeat(50)}`)

  const footerParts: string[] = []
  footerParts.push(Colors.apply(getStatusLabel(status), statusColor))
  if (duration !== undefined) {
    footerParts.push(Colors.textMuted + formatDuration(duration) + Colors.reset)
  }
  footerParts.push(Colors.apply(timeStr, "textMuted"))

  lines.push(`  ${footerParts.join("    ")}`)

  return createBoxWithTitle(lines, "", { style: "rounded", padding: 0 })
}

export namespace ActivityCard {
  export function render(props: ActivityCardProps): string[] {
    return renderActivityCard(props)
  }

  export function renderMultiple(cards: ActivityCardProps[]): string[] {
    const result: string[] = []
    for (const card of cards) {
      result.push(...renderActivityCard(card))
      result.push("")
    }
    return result
  }
}
