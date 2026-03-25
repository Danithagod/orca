import { BOX_CHARS } from "../renderer/box"

export interface SplitViewOptions {
  leftWidth?: number
  rightWidth?: number
  dividerStyle?: "solid" | "double" | "rounded"
}

const DEFAULT_DIVIDER_STYLE = "solid"

function getDividerChars(style: "solid" | "double" | "rounded") {
  switch (style) {
    case "double":
      return { vertical: "║", horizontal: "═" }
    case "rounded":
      return { vertical: "│", horizontal: "─" }
    case "solid":
    default:
      return { vertical: "│", horizontal: "─" }
  }
}

function renderVerticalDivider(height: number, style: "solid" | "double" | "rounded"): string[] {
  const chars = getDividerChars(style)
  return Array.from({ length: height }, () => chars.vertical)
}

export function renderSplitView(
  leftContent: string[][],
  rightContent: string[][],
  options: SplitViewOptions = {},
): string[] {
  const { leftWidth = 80, rightWidth = 40, dividerStyle = DEFAULT_DIVIDER_STYLE } = options

  const leftMaxHeight = Math.max(...leftContent.map((c) => c.length))
  const rightMaxHeight = Math.max(...rightContent.map((c) => c.length))
  const maxHeight = Math.max(leftMaxHeight, rightMaxHeight)

  const leftPadded = leftContent.map((lines) => [
    ...lines,
    ...Array.from({ length: maxHeight - lines.length }, () => ""),
  ])

  const rightPadded = rightContent.map((lines) => [
    ...lines,
    ...Array.from({ length: maxHeight - lines.length }, () => ""),
  ])

  const dividerLines = renderVerticalDivider(maxHeight, dividerStyle)

  const result: string[] = []
  for (let i = 0; i < maxHeight; i++) {
    const leftLine = leftPadded[i]?.map((l) => l.padEnd(leftWidth)).join("") || " ".repeat(leftWidth)
    const divider = dividerLines[i] || " "
    const rightLine = rightPadded[i]?.map((l) => l.padEnd(rightWidth)).join("") || " ".repeat(rightWidth)
    result.push(leftLine + divider + rightLine)
  }

  return result
}

export function renderWithHeaders(
  leftContent: string[][],
  rightContent: string[][],
  leftHeader: string,
  rightHeader: string,
  options: SplitViewOptions = {},
): string[] {
  const { leftWidth = 80, rightWidth = 40, dividerStyle = DEFAULT_DIVIDER_STYLE } = options

  const chars = getDividerChars(dividerStyle)
  const topLine =
    BOX_CHARS.double.topLeft +
    chars.horizontal.repeat(leftWidth - 2) +
    BOX_CHARS.double.topRight +
    chars.horizontal.repeat(rightWidth - 2) +
    BOX_CHARS.double.topRight

  const headerLine =
    BOX_CHARS.double.vertical +
    ` ${leftHeader}${" ".repeat(Math.max(0, leftWidth - leftHeader.length - 3))}` +
    BOX_CHARS.double.vertical +
    ` ${rightHeader}${" ".repeat(Math.max(0, rightWidth - rightHeader.length - 3))}` +
    BOX_CHARS.double.vertical

  const dividerLine =
    BOX_CHARS.double.vertical +
    chars.horizontal.repeat(leftWidth - 2) +
    BOX_CHARS.double.vertical +
    chars.horizontal.repeat(rightWidth - 2) +
    BOX_CHARS.double.vertical

  const content = renderSplitView(leftContent, rightContent, options)

  return [topLine, headerLine, dividerLine, ...content]
}

export namespace SplitView {
  export function render(leftContent: string[][], rightContent: string[][], options: SplitViewOptions = {}): string[] {
    return renderSplitView(leftContent, rightContent, options)
  }

  export function renderWithHeaders(
    leftContent: string[][],
    rightContent: string[][],
    leftHeader: string,
    rightHeader: string,
    options: SplitViewOptions = {},
  ): string[] {
    return renderWithHeaders(leftContent, rightContent, leftHeader, rightHeader, options)
  }
}
