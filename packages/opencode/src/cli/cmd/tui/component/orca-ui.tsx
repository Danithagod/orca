// kilocode_change - Orca UI Components
import { type JSX, Show, For } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { RGBA, TextAttributes } from "@opentui/core"

import { OrcaBorder, type OrcaBorderStyle } from "./border"

// Orca Panel Component - Box with rounded corners
export interface OrcaPanelProps {
  children: JSX.Element
  title?: string
  padding?: number
  borderStyle?: OrcaBorderStyle | "none"
  borderColor?: RGBA
  bgColor?: "panel" | "element" | "background"
  width?: number | "auto" | `${number}%`
  height?: number | "auto" | `${number}%`
  metadata?: string
}

export function OrcaPanel(props: OrcaPanelProps) {
  const { theme } = useTheme()
  const chars = () => {
    if (props.borderStyle === "none") return undefined
    return (OrcaBorder as any)[props.borderStyle ?? "futuristic"]
  }
  const padding = () => props.padding ?? 1

  const bgColor = () => {
    switch (props.bgColor) {
      case "element" :
        return theme.backgroundElement
      case "background":
        return theme.background
      default:
        return theme.backgroundPanel
    }
  }

  return (
    <box
      backgroundColor={bgColor()}
      width={props.width}
      height={props.height}
      padding={padding()}
      border={props.borderStyle === "none" ? undefined : ["top", "bottom", "left", "right"]}
      borderColor={props.borderColor ?? theme.border}
      customBorderChars={chars()}
      title={props.title ? ` [ ${props.title.toUpperCase()}_ ] ` : undefined}
    >
      <box flexDirection="column" flexGrow={1}>
        {props.children}
        <Show when={props.metadata}>
          <box marginTop="auto" paddingTop={1} border={["top"]} borderColor={theme.border} customBorderChars={OrcaBorder.solid}>
            <text fg={theme.textMuted}>
              ▪ {props.metadata?.toUpperCase()}
            </text>
          </box>
        </Show>
      </box>
    </box>
  )
}

// Orca Card Component - Activity card with rounded corners
export interface OrcaCardProps {
  title: string
  content: string
  status?: "pending" | "active" | "success" | "error" | "warning"
  timestamp?: string
  duration?: string
  icon?: string
}

export function OrcaCard(props: OrcaCardProps) {
  const { theme } = useTheme()

  const statusIcon = () => {
    switch (props.status) {
      case "pending":
        return "○"
      case "active":
        return "◉"
      case "success":
        return "✓"
      case "error":
        return "✗"
      case "warning":
        return "!"
      default:
        return "○"
    }
  }

  const statusColor = () => {
    switch (props.status) {
      case "pending":
        return theme.textMuted
      case "active":
        return theme.accent
      case "success":
        return theme.success
      case "error":
        return theme.error
      case "warning":
        return theme.warning
      default:
        return theme.textMuted
    }
  }

  return (
    <box
      backgroundColor={theme.backgroundElement}
      padding={1}
      marginBottom={1}
      border={["top", "bottom", "left", "right"]}
      borderColor={theme.border}
      customBorderChars={OrcaBorder.futuristic}
    >
      {/* Header with status */}
      <box flexDirection="row" marginBottom={1}>
        <text fg={statusColor()}>{statusIcon()}</text>
        <text fg={theme.text}> </text>
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          {props.title}
        </text>
      </box>

      {/* Content */}
      <box marginBottom={1}>
        <text fg={theme.textMuted}>{props.content}</text>
      </box>

      {/* Footer with metadata */}
      <box flexDirection="row">
        <Show when={props.status}>
          <text fg={statusColor()}>{props.status}</text>
          <text fg={theme.textMuted}> │ </text>
        </Show>
        <Show when={props.duration}>
          <text fg={theme.textMuted}>{props.duration}</text>
          <text fg={theme.textMuted}> │ </text>
        </Show>
        <Show when={props.timestamp}>
          <text fg={theme.textMuted}>{props.timestamp}</text>
        </Show>
      </box>
    </box>
  )
}

// Orca Status Badge Component
export interface OrcaStatusBadgeProps {
  status: "idle" | "active" | "error" | "success" | "warning"
  label: string
  size?: "sm" | "md" | "lg"
}

export function OrcaStatusBadge(props: OrcaStatusBadgeProps) {
  const { theme } = useTheme()

  const indicator = () => {
    switch (props.status) {
      case "idle":
        return "○"
      case "active":
        return "◉"
      case "success":
        return "●"
      case "error":
        return "✗"
      case "warning":
        return "!"
    }
  }

  const color = () => {
    switch (props.status) {
      case "idle":
        return theme.textMuted
      case "active":
        return theme.accent
      case "success":
        return theme.success
      case "error":
        return theme.error
      case "warning":
        return theme.warning
    }
  }

  return (
    <box
      flexDirection="row"
      alignItems="center"
      backgroundColor={props.status === "active" ? theme.accent : theme.backgroundElement}
      paddingLeft={1}
      paddingRight={1}
      border={["top", "bottom", "left", "right"]}
      borderColor={color()}
      customBorderChars={OrcaBorder.solid}
    >
      <text fg={props.status === "active" ? theme.background : color()} attributes={TextAttributes.BOLD}>
        {props.label.toUpperCase()}
      </text>
    </box>
  )
}

// Orca Progress Bar Component
export interface OrcaProgressBarProps {
  percent: number
  width?: number
  showLabel?: boolean
  style?: "solid" | "gradient"
}

export function OrcaProgressBar(props: OrcaProgressBarProps) {
  const { theme } = useTheme()
  const width = () => props.width ?? 40

  const filled = () => Math.round((props.percent / 100) * width())
  const empty = () => width() - filled()

  const bar = () => {
    const segment = "■"
    const bgSegment = "□"
    return segment.repeat(filled()) + bgSegment.repeat(empty())
  }

  return (
    <box flexDirection="row" alignItems="center">
      <text fg={theme.primary}>[ </text>
      <text fg={theme.accent}>{bar()}</text>
      <text fg={theme.primary}> ]</text>
      <Show when={props.showLabel}>
        <text fg={theme.text}> </text>
        <box border={["left", "right", "top", "bottom"]} borderColor={theme.border} paddingLeft={1} paddingRight={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {props.percent}%
          </text>
        </box>
      </Show>
    </box>
  )
}

// Orca Divider Component
export function OrcaDivider(props: { title?: string; style?: "rounded" | "solid" | "double" }) {
  const { theme } = useTheme()

  return (
    <box
      width="100%"
      height={1}
      flexDirection="row"
      alignItems="center"
      marginTop={0.5}
      marginBottom={0.5}
    >
      <box height={1} border={["top"]} borderColor={theme.border} width={2} marginTop={0.5} />
      <Show when={props.title}>
        <box paddingLeft={1} paddingRight={1}>
          <text fg={theme.accent} attributes={TextAttributes.BOLD}>
            {props.title}
          </text>
        </box>
      </Show>
      <box height={1} border={["top"]} borderColor={theme.border} flexGrow={1} marginTop={0.5} />
    </box>
  )
}

// Orca List Component
export interface OrcaListItem {
  label: string
  description?: string
  icon?: string
  selected?: boolean
}

export interface OrcaListProps {
  items: OrcaListItem[]
  onSelect?: (index: number) => void
}

export function OrcaList(props: OrcaListProps) {
  const { theme } = useTheme()

  return (
    <box flexDirection="column">
      <For each={props.items}>
        {(item, index) => (
          <box
            flexDirection="row"
            paddingTop={0}
            paddingBottom={0}
            backgroundColor={item.selected ? theme.backgroundElement : undefined}
          >
            <text fg={item.selected ? theme.primary : theme.accent}>[ {item.selected ? "●" : " "} ]</text>
            <text fg={theme.text}> </text>
            <text
              fg={item.selected ? theme.primary : theme.text}
              attributes={item.selected ? TextAttributes.BOLD : undefined}
            >
              {item.label}
            </text>
            <Show when={item.description}>
              <text fg={theme.textMuted}> // {item.description}</text>
            </Show>
          </box>
        )}
      </For>
    </box>
  )
}
