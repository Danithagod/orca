import { Colors } from "../theme/colors"
import { BOX_CHARS, createPanel } from "../renderer/box"
import { muted, secondary, accent } from "../renderer/text"

export namespace Format {
  export interface ToolResult {
    tool: string
    success: boolean
    duration?: number
    output?: string
    error?: string
  }

  export interface ErrorInfo {
    message: string
    code?: string
    stack?: string
    suggestions?: string[]
  }

  export interface JsonFormatOptions {
    indent?: number
    colorize?: boolean
    maxDepth?: number
    maxLineLength?: number
  }

  export interface MemoryStats {
    total: number
    byCategory: Record<string, number>
    recentKeys: string[]
    hits: number
    misses: number
  }

  export interface AgentStats {
    id: string
    name: string
    status: "idle" | "active" | "error" | "waiting"
    tasksCompleted: number
    currentTask?: string
    lastActivity?: Date
  }

  export function toolResult(result: ToolResult): string[] {
    const { tool, success, duration, output, error } = result
    const statusIcon = success ? Colors.apply("✓", "success") : Colors.apply("✗", "error")
    const statusText = success ? Colors.apply("Success", "success") : Colors.apply("Failed", "error")

    const lines: string[] = []
    lines.push(`  ${statusIcon} ${Colors.apply(tool, "primaryLight")}    ${statusText}`)

    if (duration !== undefined) {
      lines.push(`  ${muted(`Duration: ${duration}ms`)}`)
    }

    lines.push(`  ${Colors.apply(BOX_CHARS.rounded.horizontal.repeat(40), "textMuted")}`)

    if (error) {
      lines.push(`  ${Colors.apply("Error:", "error")} ${Colors.apply(error, "textSecondary")}`)
    }

    if (output) {
      const outputLines = output.split("\n").slice(0, 10)
      for (const line of outputLines) {
        lines.push(`  ${muted(line.slice(0, 80))}`)
      }
      if (output.split("\n").length > 10) {
        lines.push(`  ${muted("... (truncated)")}`)
      }
    }

    return lines
  }

  export function error(err: ErrorInfo): string[] {
    const lines: string[] = []
    lines.push(`  ${Colors.apply("✗ Error", "error")}`)
    lines.push(`  ${Colors.apply(BOX_CHARS.rounded.horizontal.repeat(40), "error")}`)
    lines.push(`  ${Colors.apply(err.message, "textPrimary")}`)

    if (err.code) {
      lines.push(`  ${muted(`Code: ${err.code}`)}`)
    }

    if (err.stack) {
      lines.push(`  ${muted("Stack trace:")}`)
      const stackLines = err.stack.split("\n").slice(0, 5)
      for (const line of stackLines) {
        lines.push(`    ${muted(line.slice(0, 76))}`)
      }
    }

    if (err.suggestions && err.suggestions.length > 0) {
      lines.push(`  ${accent("Suggestions:")}`)
      for (const suggestion of err.suggestions.slice(0, 3)) {
        lines.push(`    ${Colors.apply("•", "accent")} ${secondary(suggestion)}`)
      }
    }

    return lines
  }

  export function json(data: unknown, options: JsonFormatOptions = {}): string[] {
    const { indent = 2, colorize = true, maxDepth = 10, maxLineLength = 120 } = options
    const lines: string[] = []

    function formatValue(value: unknown, depth: number, key?: string): string {
      const prefix = key ? `"${key}": ` : ""
      const indentation = " ".repeat(depth * indent)

      if (value === null) return colorize ? Colors.apply("null", "textMuted") : "null"
      if (value === undefined) return colorize ? Colors.apply("undefined", "textMuted") : "undefined"

      if (typeof value === "string") {
        return colorize ? `${prefix}${Colors.apply(`"${value}"`, "success")}` : `${prefix}"${value}"`
      }
      if (typeof value === "number") {
        return colorize ? `${prefix}${Colors.apply(String(value), "accent")}` : `${prefix}${value}`
      }
      if (typeof value === "boolean") {
        return colorize ? `${prefix}${Colors.apply(String(value), "warning")}` : `${prefix}${value}`
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return `${prefix}[]`
        if (depth >= maxDepth) return `${prefix}[...]`

        const items = value.map((item) => formatValue(item, depth + 1)).join(", ")
        if (items.length < maxLineLength) return `${prefix}[${items}]`

        const arrLines = value.map((item) => {
          const formatted = formatValue(item, depth + 1)
          return `${indentation}  ${formatted}`
        })
        return `${prefix}[\n${arrLines.join(",\n")}\n${indentation}]`
      }

      if (typeof value === "object") {
        const obj = value as Record<string, unknown>
        const keys = Object.keys(obj)
        if (keys.length === 0) return `${prefix}{}`

        if (depth >= maxDepth) return `${prefix}{...}`

        const objLines = keys.map((k) => {
          const formatted = formatValue(obj[k], depth + 1, k)
          return `${indentation}  ${formatted}`
        })

        return `${prefix}{\n${objLines.join(",\n")}\n${indentation}}`
      }

      return String(value)
    }

    const formatted = formatValue(data, 0)
    lines.push(...formatted.split("\n"))

    return lines
  }

  export function memoryStats(stats: MemoryStats): string[] {
    const lines: string[] = []
    lines.push(`  ${Colors.apply("Memory Statistics", "primaryLight")}`)
    lines.push(`  ${Colors.apply(BOX_CHARS.rounded.horizontal.repeat(30), "textMuted")}`)
    lines.push(`  Total: ${Colors.apply(String(stats.total), "accent")}`)
    lines.push(
      `  Hits: ${Colors.apply(String(stats.hits), "success")}  Misses: ${Colors.apply(String(stats.misses), "warning")}`,
    )

    if (Object.keys(stats.byCategory).length > 0) {
      lines.push(`  ${secondary("By Category:")}`)
      for (const [category, count] of Object.entries(stats.byCategory)) {
        lines.push(`    ${muted(category)}: ${Colors.apply(String(count), "textSecondary")}`)
      }
    }

    if (stats.recentKeys.length > 0) {
      lines.push(`  ${secondary("Recent:")}`)
      for (const key of stats.recentKeys.slice(0, 5)) {
        lines.push(`    ${Colors.apply("•", "accent")} ${muted(key.slice(0, 40))}`)
      }
    }

    return createPanel("Memory", lines, { style: "rounded", padding: 1 })
  }

  export function agentStats(agents: AgentStats[]): string[] {
    const lines: string[] = []
    lines.push(`  ${Colors.apply("Agent Status", "primaryLight")}`)
    lines.push(`  ${Colors.apply(BOX_CHARS.rounded.horizontal.repeat(30), "textMuted")}`)

    for (const agent of agents) {
      const statusIcon =
        agent.status === "active"
          ? Colors.apply("◉", "accent")
          : agent.status === "error"
            ? Colors.apply("✗", "error")
            : agent.status === "waiting"
              ? Colors.apply("◎", "warning")
              : Colors.apply("○", "textMuted")

      const statusText =
        agent.status === "active"
          ? Colors.apply("Active", "accent")
          : agent.status === "error"
            ? Colors.apply("Error", "error")
            : agent.status === "waiting"
              ? Colors.apply("Waiting", "warning")
              : Colors.apply("Idle", "textMuted")

      lines.push(`  ${statusIcon} ${Colors.apply(agent.name, "textPrimary")}    ${statusText}`)

      if (agent.currentTask && agent.status === "active") {
        lines.push(`    ${muted(agent.currentTask.slice(0, 50))}`)
      }

      if (agent.tasksCompleted > 0) {
        lines.push(`    ${muted(`${agent.tasksCompleted} tasks completed`)}`)
      }
    }

    return lines
  }

  export function truncateLines(lines: string[], maxLines: number, suffix = "..."): string[] {
    if (lines.length <= maxLines) return lines
    return [...lines.slice(0, maxLines - 1), suffix]
  }

  export function padLines(lines: string[], width: number, char = " "): string[] {
    return lines.map((line) => line.padEnd(width, char))
  }
}
