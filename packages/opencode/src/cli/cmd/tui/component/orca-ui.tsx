import { TextAttributes, type RGBA } from "@opentui/core"
import { selectedForeground, useTheme } from "@tui/context/theme"
import { For, Show, type JSX } from "solid-js"
import { useKV } from "@tui/context/kv"
import "opentui-spinner/solid"

import type { OrcaBorderStyle } from "./border"

const DOT_LINE = "· ".repeat(160)
const BADGE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

type PanelVariant = "frame" | "panel" | "card"

export interface OrcaPanelProps {
  children: JSX.Element
  title?: string
  titleRight?: string
  subtitle?: string
  footer?: string
  padding?: number
  borderStyle?: OrcaBorderStyle | "none"
  borderColor?: RGBA
  bgColor?: "panel" | "element" | "background"
  width?: number | "auto" | `${number}%`
  height?: number | "auto" | `${number}%`
  metadata?: string
  variant?: PanelVariant
  inset?: boolean
}

export function OrcaDots(props: { rows?: number; fg?: RGBA }) {
  const { theme } = useTheme()
  const rows = () => props.rows ?? 1
  return (
    <box flexDirection="column" width="100%">
      <For each={Array.from({ length: rows() })}>
        {() => (
          <text fg={props.fg ?? theme.borderSubtle} wrapMode="none">
            {DOT_LINE}
          </text>
        )}
      </For>
    </box>
  )
}

export function OrcaPanel(props: OrcaPanelProps) {
  const { theme } = useTheme()
  const variant = () => props.variant ?? "panel"
  const inset = () => props.inset ?? variant() !== "card"
  const outerColor = () => props.borderColor ?? (variant() === "frame" ? theme.borderActive : theme.border)
  const innerColor = () => (variant() === "frame" ? theme.border : theme.borderSubtle)
  const outerBg = () => (variant() === "frame" ? theme.backgroundPanel : surface())
  const surface = () => {
    switch (props.bgColor) {
      case "element":
        return theme.backgroundElement
      case "background":
        return theme.background
      default:
        return theme.backgroundPanel
    }
  }
  const chars = () => {
    if (props.borderStyle === "none") return undefined
    return undefined
  }
  const padding = () => props.padding ?? 1
  const showHeader = () => Boolean(props.title || props.titleRight || props.subtitle)
  const showFooter = () => Boolean(props.footer || props.metadata)

  return (
    <box
      backgroundColor={outerBg()}
      width={props.width}
      height={props.height}
      padding={padding()}
      border={props.borderStyle === "none" ? undefined : ["top", "bottom", "left", "right"]}
      borderColor={outerColor()}
      customBorderChars={chars()}
      flexDirection="column"
      gap={0}
    >
      <Show when={showHeader()}>
        <box flexDirection="column" gap={0} flexShrink={0}>
          <box flexDirection="row" alignItems="center" gap={1}>
            <box flexDirection="row" gap={1} flexGrow={1} flexShrink={1} minWidth={1}>
              <Show when={props.title}>
                <text fg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none">
                  {props.title}
                </text>
              </Show>
              <Show when={props.subtitle}>
                <text fg={theme.textMuted} wrapMode="none">
                  {props.subtitle}
                </text>
              </Show>
            </box>
            <box flexGrow={1} minWidth={1} />
            <Show when={props.titleRight}>
              <text fg={theme.text} attributes={TextAttributes.BOLD} wrapMode="none" flexShrink={0}>
                {props.titleRight}
              </text>
            </Show>
          </box>
          <OrcaDots />
        </box>
      </Show>

      <box
        flexDirection="column"
        flexGrow={1}
        gap={0}
        backgroundColor={surface()}
        border={inset() ? ["top", "bottom", "left", "right"] : undefined}
        borderColor={inset() ? innerColor() : undefined}
      >
        {props.children}
      </box>

      <Show when={showFooter()}>
        <box flexDirection="column" gap={0} flexShrink={0}>
          <OrcaDots fg={theme.borderSubtle} />
          <box flexDirection="row" alignItems="center" gap={1}>
            <Show when={props.footer}>
              <text fg={theme.textMuted} wrapMode="none" minWidth={1} flexGrow={1} flexShrink={1}>
                {props.footer}
              </text>
            </Show>
            <box flexGrow={1} minWidth={1} />
            <Show when={props.metadata}>
              <text fg={theme.textMuted} wrapMode="none" flexShrink={0}>
                {props.metadata}
              </text>
            </Show>
          </box>
        </box>
      </Show>
    </box>
  )
}

export interface OrcaCardProps {
  title: string
  content: string
  status?: "pending" | "active" | "success" | "error" | "warning"
  timestamp?: string
  duration?: string
}

export function OrcaCard(props: OrcaCardProps) {
  const { theme } = useTheme()
  return (
    <OrcaPanel
      bgColor="element"
      variant="card"
      title={props.title.toUpperCase()}
      titleRight={props.status?.toUpperCase()}
      footer={[props.duration, props.timestamp].filter(Boolean).join(" · ")}
      padding={1}
    >
      <text fg={theme.textMuted} wrapMode="word">
        {props.content}
      </text>
    </OrcaPanel>
  )
}

export interface OrcaStatusBadgeProps {
  status: "idle" | "active" | "paused" | "error" | "success" | "warning" | "muted"
  label: string
  size?: "xs" | "sm" | "md" | "lg"
  icon?: string
  uppercase?: boolean
}

export function OrcaStatusBadge(props: OrcaStatusBadgeProps) {
  const { theme } = useTheme()
  const kv = useKV()

  const tone = () => {
    switch (props.status) {
      case "active":
        return theme.primary
      case "paused":
        return theme.warning
      case "warning":
        return theme.warning
      case "error":
        return theme.error
      case "success":
        return theme.success
      case "idle":
      case "muted":
        return theme.textMuted
    }
  }

  const bg = () => {
    switch (props.status) {
      case "active":
        return theme.backgroundElement
      case "paused":
        return theme.backgroundElement
      case "warning":
      case "error":
      case "success":
      case "idle":
      case "muted":
        return theme.backgroundElement
    }
  }

  const border = () => {
    switch (props.status) {
      case "idle":
      case "muted":
        return theme.border
      case "active":
        return theme.borderActive
      case "paused":
        return theme.warning
      case "warning":
      case "error":
      case "success":
        return tone()
    }
  }

  const fg = () => {
    if (props.status === "active") return theme.primary
    if (props.status === "paused") return theme.warning
    if (props.status === "idle" || props.status === "muted") return theme.textMuted
    return tone()
  }

  const pad = () => {
    switch (props.size) {
      case "xs":
        return { left: 1, right: 1 }
      case "sm":
        return { left: 1, right: 1 }
      case "lg":
        return { left: 2, right: 2 }
      default:
        return { left: 1, right: 1 }
    }
  }

  return (
    <box
      flexDirection="row"
      alignItems="center"
      backgroundColor={props.size === "xs" ? undefined : bg()}
      paddingLeft={pad().left}
      paddingRight={pad().right}
      border={props.size === "xs" ? ["left", "right"] : ["top", "bottom", "left", "right"]}
      borderColor={border()}
      gap={props.icon || props.status === "active" ? 1 : 0}
      flexShrink={0}
    >
      <Show when={props.icon}>
        <text fg={fg()} bg={props.size === "xs" ? undefined : bg()} attributes={TextAttributes.BOLD}>
          {props.icon}
        </text>
      </Show>
      <Show when={props.status === "active"}>
        <Show
          when={kv.get("animations_enabled", true)}
          fallback={<text fg={fg()} bg={props.size === "xs" ? undefined : bg()} wrapMode="none">•</text>}
        >
          <spinner frames={BADGE_FRAMES} interval={80} color={fg()} />
        </Show>
      </Show>
      <text fg={fg()} bg={props.size === "xs" ? undefined : bg()} attributes={TextAttributes.BOLD} wrapMode="none">
        {props.uppercase === false ? props.label : props.label.toUpperCase()}
      </text>
    </box>
  )
}

export interface OrcaProgressBarProps {
  percent: number
  width?: number
  showLabel?: boolean
  animate?: boolean
}

export function OrcaProgressBar(props: OrcaProgressBarProps) {
  const { theme } = useTheme()
  const kv = useKV()
  const width = () => props.width ?? 8
  const percent = () => Math.max(0, Math.min(100, props.percent))
  const enabled = () => kv.get("animations_enabled", true) && props.animate !== false
  const filled = () => {
    if (percent() <= 0) return 0
    return Math.max(1, Math.round((percent() / 100) * width()))
  }
  const empty = () => Math.max(0, width() - filled())
  const fillColor = () => (enabled() ? theme.primary : theme.textMuted)

  return (
    <box flexDirection="row" alignItems="center" gap={1}>
      <box flexDirection="row" alignItems="center" gap={0}>
        <Show when={filled() > 0}>
          <text fg={fillColor()} wrapMode="none">{Array(filled()).fill("■").join("")}</text>
        </Show>
        <Show when={empty() > 0}>
          <text fg={theme.borderSubtle} wrapMode="none">{Array(empty()).fill("·").join("")}</text>
        </Show>
      </box>
      <Show when={props.showLabel}>
        <text fg={theme.textMuted}>{percent()}%</text>
      </Show>
    </box>
  )
}

export function OrcaDivider(props: { title?: string }) {
  const { theme } = useTheme()
  return (
    <box width="100%" flexDirection="row" alignItems="center" gap={1}>
      <text fg={theme.borderSubtle} wrapMode="none" flexGrow={1}>
        {DOT_LINE}
      </text>
      <Show when={props.title}>
        <text fg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none" flexShrink={0}>
          {props.title}
        </text>
      </Show>
      <text fg={theme.borderSubtle} wrapMode="none" flexGrow={1}>
        {DOT_LINE}
      </text>
    </box>
  )
}

export interface OrcaListItem {
  label: string
  description?: string
  icon?: string
  selected?: boolean
}

export interface OrcaListProps {
  items: OrcaListItem[]
}

export function OrcaList(props: OrcaListProps) {
  const { theme } = useTheme()
  return (
    <box flexDirection="column" gap={1}>
      <For each={props.items}>
        {(item) => (
          <box
            flexDirection="row"
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={item.selected ? theme.backgroundElement : undefined}
            gap={1}
          >
            <text fg={item.selected ? theme.primary : theme.textMuted}>{item.selected ? "▣" : (item.icon ?? "·")}</text>
            <text fg={item.selected ? theme.text : theme.text}>{item.label}</text>
            <Show when={item.description}>
              <text fg={theme.textMuted}>- {item.description}</text>
            </Show>
          </box>
        )}
      </For>
    </box>
  )
}
