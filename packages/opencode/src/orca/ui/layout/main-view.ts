import { Colors } from "../theme/colors"
import { BOX_CHARS } from "../renderer/box"

export interface HeaderInfo {
  title?: string
  memoryCount?: number
  agentCount?: number
}

export interface MainViewOptions {
  header?: HeaderInfo
  activityAreaHeight?: number
  showMemory?: boolean
  showAgents?: boolean
}

const DEFAULT_HEADER: HeaderInfo = {
  title: "ORCA",
}

function renderHeader(info: HeaderInfo, width: number): string {
  const title = info.title || "ORCA"
  const titleStr = Colors.apply(title, "primaryLight")

  const rightInfo: string[] = []
  if (info.memoryCount !== undefined) {
    rightInfo.push(`Memory: ${Colors.apply(info.memoryCount.toString(), "accent")}`)
  }
  if (info.agentCount !== undefined) {
    rightInfo.push(`Agents: ${Colors.apply(info.agentCount.toString(), "accent")}`)
  }

  const rightStr = rightInfo.length > 0 ? `  ${rightInfo.join("  ")}` : ""
  const padding = Math.max(0, width - title.length - rightStr.length)

  return titleStr + " ".repeat(padding) + rightStr
}

function renderBorder(width: number, type: "top" | "middle" | "bottom"): string {
  const chars = BOX_CHARS.double
  switch (type) {
    case "top":
      return chars.topLeft + chars.horizontal.repeat(width - 2) + chars.topRight
    case "middle":
      return chars.vertical + " ".repeat(width - 2) + chars.vertical
    case "bottom":
      return chars.bottomLeft + chars.horizontal.repeat(width - 2) + chars.bottomRight
  }
}

function renderInputArea(width: number, prompt = ">"): string[] {
  const innerWidth = width - 4
  return [
    `  ${BOX_CHARS.rounded.topLeft}${"─".repeat(innerWidth)}${BOX_CHARS.rounded.topRight}`,
    `  ${BOX_CHARS.rounded.vertical} ${Colors.apply(prompt, "primaryLight")} ${Colors.apply("_".repeat(innerWidth - 3), "textMuted")} ${BOX_CHARS.rounded.vertical}`,
    `  ${BOX_CHARS.rounded.bottomLeft}${"─".repeat(innerWidth)}${BOX_CHARS.rounded.bottomRight}`,
  ]
}

export function render(options: MainViewOptions = {}): string[] {
  const { header = DEFAULT_HEADER, showMemory = false, showAgents = false } = options

  const width = process.stdout.columns ?? 120
  const lines: string[] = []

  lines.push(renderBorder(width, "top"))
  lines.push(renderHeader(header, width))
  lines.push(renderBorder(width, "middle"))

  lines.push("")
  lines.push(`  ${Colors.apply("Activity Area", "textMuted")}`)
  lines.push(`  ${Colors.apply("─".repeat(Math.min(50, width - 4)), "textMuted")}`)
  lines.push(`  ${Colors.apply("[Cards appear here with rounded corners]", "textMuted")}`)
  lines.push("")

  lines.push(renderBorder(width, "middle"))
  lines.push(...renderInputArea(width))
  lines.push(renderBorder(width, "bottom"))

  return lines
}

export function renderActivityOnly(activityLines: string[][], options: MainViewOptions = {}): string[] {
  const { header = DEFAULT_HEADER } = options
  const width = process.stdout.columns ?? 120

  const lines: string[] = []
  lines.push(renderBorder(width, "top"))
  lines.push(renderHeader(header, width))
  lines.push(renderBorder(width, "middle"))

  for (const activity of activityLines) {
    lines.push(...activity)
    lines.push("")
  }

  lines.push(renderBorder(width, "middle"))
  lines.push(...renderInputArea(width))
  lines.push(renderBorder(width, "bottom"))

  return lines
}

export namespace MainView {
  export function render(options: MainViewOptions = {}): string[] {
    return render(options)
  }

  export function renderActivityOnly(activityLines: string[][], options: MainViewOptions = {}): string[] {
    return renderActivityOnly(activityLines, options)
  }

  export function renderHeader(info: HeaderInfo, width?: number): string {
    return renderHeader(info, width ?? process.stdout.columns ?? 120)
  }
}
