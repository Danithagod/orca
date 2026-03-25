import { Colors } from "../theme/colors"

export type TextStyle = "normal" | "bold" | "dim" | "italic" | "underline"

export function style(text: string, ...styles: TextStyle[]): string {
  let result = text
  for (const s of styles) {
    switch (s) {
      case "bold":
        result = Colors.bold + result
        break
      case "dim":
        result = Colors.dim + result
        break
      case "italic":
        result = Colors.italic + result
        break
      case "underline":
        result = Colors.underline + result
        break
    }
  }
  return result + Colors.reset
}

export function highlight(text: string): string {
  return Colors.apply(text, "accent")
}

export function success(text: string): string {
  return Colors.apply(text, "success")
}

export function warning(text: string): string {
  return Colors.apply(text, "warning")
}

export function error(text: string): string {
  return Colors.apply(text, "error")
}

export function muted(text: string): string {
  return Colors.apply(text, "textMuted")
}

export function secondary(text: string): string {
  return Colors.apply(text, "textSecondary")
}

export function primary(text: string): string {
  return Colors.apply(text, "primary")
}

export function accent(text: string): string {
  return Colors.apply(text, "accent")
}

export function truncate(text: string, maxWidth: number, suffix = "..."): string {
  if (text.length <= maxWidth) return text
  return text.slice(0, maxWidth - suffix.length) + suffix
}

export function padRight(text: string, width: number, char = " "): string {
  return text.padEnd(width, char)
}

export function padLeft(text: string, width: number, char = " "): string {
  return text.padStart(width, char)
}

export function center(text: string, width: number, char = " "): string {
  const padding = Math.max(0, width - text.length)
  const leftPad = Math.floor(padding / 2)
  const rightPad = padding - leftPad
  return char.repeat(leftPad) + text + char.repeat(rightPad)
}

export function wrap(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
    } else if (currentLine.length + 1 + word.length <= maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

export function wrapWithIndent(text: string, maxWidth: number, indent = 0): string[] {
  const lines = wrap(text, maxWidth - indent)
  const indentStr = " ".repeat(indent)
  return lines.map((line) => indentStr + line)
}
