import { Colors } from "../theme/colors"
import { createBox, BOX_CHARS } from "../renderer/box"
import { secondary, accent } from "../renderer/text"

export interface CommandPaletteProps {
  input: string
  suggestions: string[]
  selectedIndex: number
  prompt?: string
}

function renderInputLine(input: string, prompt = ">"): string {
  const promptStr = Colors.apply(`${prompt} `, "primaryLight")
  const inputStr = Colors.apply(input, "textPrimary")
  const cursor = Colors.apply("█", "accent")
  return `${promptStr}${inputStr}${cursor} `
}

function renderSuggestions(suggestions: string[], selectedIndex: number): string[] {
  if (suggestions.length === 0) return []

  const lines: string[] = []
  lines.push(`  ${Colors.apply("─".repeat(40), "textMuted")}`)
  lines.push(`  ${Colors.apply("Suggestions:", "textSecondary")}`)

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i]
    const isSelected = i === selectedIndex

    const prefix = isSelected ? Colors.apply("►", "accent") : "  "

    const displayText = isSelected ? accent(suggestion) : secondary(suggestion)

    lines.push(`  ${prefix} ${displayText}`)
  }

  return lines
}

export function render(props: CommandPaletteProps): string[] {
  const { input, suggestions, selectedIndex, prompt } = props

  const lines: string[] = []

  const inputLine = renderInputLine(input, prompt)
  lines.push(`  ${BOX_CHARS.rounded.topLeft}${"─".repeat(inputLine.length + 2)}${BOX_CHARS.rounded.topRight}`)
  lines.push(`  ${BOX_CHARS.rounded.vertical} ${inputLine} ${BOX_CHARS.rounded.vertical}`)
  lines.push(`  ${BOX_CHARS.rounded.bottomLeft}${"─".repeat(inputLine.length + 2)}${BOX_CHARS.rounded.bottomRight}`)

  if (suggestions.length > 0) {
    lines.push(...renderSuggestions(suggestions, selectedIndex))
  }

  return lines
}

export function renderCompact(props: CommandPaletteProps): string {
  const { input, suggestions, selectedIndex, prompt } = props

  const promptStr = Colors.apply(`${prompt || ">"} `, "primaryLight")
  const inputStr = input ? Colors.apply(input, "textPrimary") : Colors.apply("...", "textMuted")

  if (suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length) {
    const selected = suggestions[selectedIndex]
    const display = input ? selected.replace(new RegExp(`^${input}`, "i"), Colors.apply(input, "accent")) : selected
    return `${promptStr}${display}`
  }

  return `${promptStr}${inputStr}`
}

export namespace CommandPalette {
  export function render(props: CommandPaletteProps): string[] {
    return render(props)
  }

  export function renderCompact(props: CommandPaletteProps): string {
    return renderCompact(props)
  }

  export function filterSuggestions(input: string, all: string[]): string[] {
    if (!input) return all.slice(0, 5)
    const lower = input.toLowerCase()
    return all.filter((s) => s.toLowerCase().includes(lower)).slice(0, 5)
  }
}
