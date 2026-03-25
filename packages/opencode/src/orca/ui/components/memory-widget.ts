import { Colors } from "../theme/colors"
import { createPanel } from "../renderer/box"
import { secondary, accent } from "../renderer/text"

export interface MemoryWidgetProps {
  totalMemories: number
  categories: Record<string, number>
  recentAccess: string[]
  compact?: boolean
}

function renderMemoryCount(total: number): string {
  const countStr = Colors.apply(total.toString(), "primaryLight")
  const label = Colors.apply("entries", "textMuted")
  return `  ┌───────┐          \n  │ ${countStr}    │ ${label}  \n  └───────┘          `
}

function renderCategories(categories: Record<string, number>): string[] {
  const lines: string[] = []
  for (const [name, count] of Object.entries(categories)) {
    lines.push(`  ${Colors.apply(name, "textSecondary")} (${Colors.apply(count.toString(), "textMuted")})`)
  }
  return lines
}

function renderRecentAccess(access: string[]): string[] {
  if (access.length === 0) return []
  const lines: string[] = []
  for (const item of access.slice(0, 5)) {
    lines.push(`  ${Colors.apply("•", "accent")} ${secondary(item)}`)
  }
  return lines
}

export function render(props: MemoryWidgetProps): string[] {
  const { totalMemories, categories, recentAccess, compact = false } = props

  const lines: string[] = []

  if (compact) {
    lines.push(`Memory: ${Colors.apply(totalMemories.toString(), "primaryLight")}`)
    if (recentAccess.length > 0) {
      lines.push(`${Colors.apply("•", "accent")} ${recentAccess[0]}`)
    }
    return lines
  }

  lines.push(`  Memory`)
  lines.push(`  ${Colors.apply("─".repeat(20), "textMuted")}`)

  const countDisplay = renderMemoryCount(totalMemories)
  lines.push(...countDisplay.split("\n"))

  if (recentAccess.length > 0) {
    lines.push("")
    lines.push(`  ${Colors.apply("Recent:", "textSecondary")}`)
    lines.push(...renderRecentAccess(recentAccess))
  }

  if (Object.keys(categories).length > 0) {
    lines.push("")
    lines.push(`  ${Colors.apply("Categories:", "textSecondary")}`)
    lines.push(...renderCategories(categories))
  }

  return createPanel("Memory", lines, { style: "rounded", padding: 1 })
}

export namespace MemoryWidget {
  export function render(props: MemoryWidgetProps): string[] {
    return render(props)
  }

  export function renderCompact(props: MemoryWidgetProps): string[] {
    return render({ ...props, compact: true })
  }
}
