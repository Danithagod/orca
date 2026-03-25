export const BOX_CHARS = {
  rounded: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    horizontal: "─",
    vertical: "│",
  },
  solid: {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
  },
  double: {
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
    horizontal: "═",
    vertical: "║",
  },
  bold: {
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    horizontal: "━",
    vertical: "┃",
  },
}

export type BoxStyle = keyof typeof BOX_CHARS

export interface BoxOptions {
  style?: BoxStyle
  padding?: number
  width?: number
}

export function createBox(content: string[], options: BoxOptions = {}): string[] {
  const { style = "rounded", padding = 1, width: optWidth } = options
  const chars = BOX_CHARS[style]

  const effectiveWidth = optWidth ?? Math.max(...content.map((c) => c.length)) + padding * 2 + 2

  const topBorder = chars.topLeft + chars.horizontal.repeat(effectiveWidth - 2) + chars.topRight
  const bottomBorder = chars.bottomLeft + chars.horizontal.repeat(effectiveWidth - 2) + chars.bottomRight

  const paddedContent = content.map((line) => {
    const paddedLine = line.padEnd(effectiveWidth - 2 - padding * 2)
    return chars.vertical + " ".repeat(padding) + paddedLine + " ".repeat(padding) + chars.vertical
  })

  return [topBorder, ...paddedContent, bottomBorder]
}

export function createBoxWithTitle(content: string[], title: string, options: BoxOptions = {}): string[] {
  const { style = "rounded", padding = 1 } = options
  const chars = BOX_CHARS[style]

  const effectiveWidth = Math.max(...content.map((c) => c.length), title.length + 4) + padding * 2 + 2

  const topBorder =
    chars.topLeft +
    chars.horizontal +
    " " +
    title +
    " " +
    chars.horizontal.repeat(effectiveWidth - title.length - 4) +
    chars.topRight

  const bottomBorder = chars.bottomLeft + chars.horizontal.repeat(effectiveWidth - 2) + chars.bottomRight

  const paddedContent = content.map((line) => {
    const paddedLine = line.padEnd(effectiveWidth - 2 - padding * 2)
    return chars.vertical + " ".repeat(padding) + paddedLine + " ".repeat(padding) + chars.vertical
  })

  return [topBorder, ...paddedContent, bottomBorder]
}

export function createPanel(title: string, lines: string[], options: BoxOptions = {}): string[] {
  const { style = "solid", padding = 1 } = options
  const chars = BOX_CHARS[style]

  const effectiveWidth = Math.max(...lines.map((c) => c.length), title.length + 4) + padding * 2 + 2

  const titleLine =
    chars.topLeft +
    " " +
    title +
    " " +
    chars.horizontal.repeat(Math.max(0, effectiveWidth - title.length - 4)) +
    chars.topRight

  const paddedLines = lines.map((line) => {
    const paddedLine = line.padEnd(effectiveWidth - 2 - padding * 2)
    return chars.vertical + " ".repeat(padding) + paddedLine + " ".repeat(padding) + chars.vertical
  })

  const bottomBorder = chars.bottomLeft + chars.horizontal.repeat(effectiveWidth - 2) + chars.bottomRight

  return [titleLine, ...paddedLines, bottomBorder]
}
