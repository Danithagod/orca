export namespace Colors {
  export const primary = "#0066cc"
  export const primaryLight = "#3399ff"
  export const primaryDark = "#004080"
  export const primaryBg = "#0a1628"

  export const accent = "#00d4ff"
  export const accentGlow = "#00d4ff40"
  export const success = "#10b981"
  export const warning = "#f59e0b"
  export const error = "#ef4444"

  export const surfaceDark = "#0a1628"
  export const surfacePanel = "#0f1f35"
  export const surfaceCard = "#142540"
  export const surfaceHover = "#1a3a5c"

  export const borderDefault = "#1a3a5c"
  export const borderFocus = "#3399ff"
  export const borderGlow = "#0066cc50"

  export const textPrimary = "#ffffff"
  export const textSecondary = "#94a3b8"
  export const textMuted = "#64748b"

  export type ColorType =
    | "primary"
    | "primaryLight"
    | "primaryDark"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "textPrimary"
    | "textSecondary"
    | "textMuted"

  const ansiMap: Record<ColorType, string> = {
    primary: "\x1b[38;5;33m",
    primaryLight: "\x1b[38;5;45m",
    primaryDark: "\x1b[38;5;25m",
    accent: "\x1b[38;5;45m",
    success: "\x1b[38;5;40m",
    warning: "\x1b[38;5;214m",
    error: "\x1b[38;5;196m",
    textPrimary: "\x1b[97m",
    textSecondary: "\x1b[38;5;146m",
    textMuted: "\x1b[38;5;246m",
  }

  const hexRgbMap: Record<ColorType, { r: number; g: number; b: number }> = {
    primary: { r: 0, g: 102, b: 204 },
    primaryLight: { r: 51, g: 153, b: 255 },
    primaryDark: { r: 0, g: 64, b: 128 },
    accent: { r: 0, g: 212, b: 255 },
    success: { r: 16, g: 185, b: 129 },
    warning: { r: 245, g: 158, b: 11 },
    error: { r: 239, g: 68, b: 68 },
    textPrimary: { r: 255, g: 255, b: 255 },
    textSecondary: { r: 148, g: 163, b: 184 },
    textMuted: { r: 100, g: 116, b: 139 },
  }

  export function ansi(color: ColorType): string {
    return ansiMap[color]
  }

  export function rgb(color: ColorType): { r: number; g: number; b: number } {
    return hexRgbMap[color]
  }

  export function hex(color: ColorType): string {
    return color in hexRgbMap
      ? `#${hexRgbMap[color].r.toString(16).padStart(2, "0")}${hexRgbMap[color].g.toString(16).padStart(2, "0")}${hexRgbMap[color].b.toString(16).padStart(2, "0")}`
      : "#ffffff"
  }

  export function ansi256(color: ColorType): string {
    const { r, g, b } = hexRgbMap[color]
    return `\x1b[38;2;${r};${g};${b}m`
  }

  export function apply(text: string, color: ColorType): string {
    return `${ansiMap[color]}${text}\x1b[0m`
  }

  export function apply256(text: string, color: ColorType): string {
    return `${ansi256(color)}${text}\x1b[0m`
  }

  export const reset = "\x1b[0m"
  export const bold = "\x1b[1m"
  export const dim = "\x1b[2m"
  export const italic = "\x1b[3m"
  export const underline = "\x1b[4m"
}

export const gradient = {
  primary: "linear-gradient(135deg, #0066cc 0%, #3399ff 100%)",
  glow: "radial-gradient(circle, #00d4ff20 0%, transparent 70%)",
}

export namespace HighContrast {
  export const primary = "#00BBFF"
  export const primaryLight = "#66CCFF"
  export const primaryDark = "#0088CC"
  export const accent = "#00FFFF"
  export const success = "#00FF00"
  export const warning = "#FFFF00"
  export const error = "#FF0000"
  export const textPrimary = "#FFFFFF"
  export const textSecondary = "#FFFFFF"
  export const textMuted = "#CCCCCC"
  export const background = "#000000"

  export type HighContrastColorType =
    | "primary"
    | "primaryLight"
    | "primaryDark"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "textPrimary"
    | "textSecondary"
    | "textMuted"
    | "background"

  const ansiHighContrastMap: Record<HighContrastColorType, string> = {
    primary: "\x1b[38;5;74m",
    primaryLight: "\x1b[38;5;81m",
    primaryDark: "\x1b[38;5;32m",
    accent: "\x1b[38;5;51m",
    success: "\x1b[38;5;46m",
    warning: "\x1b[38;5;226m",
    error: "\x1b[38;5;196m",
    textPrimary: "\x1b[97m",
    textSecondary: "\x1b[97m",
    textMuted: "\x1b[38;5;252m",
    background: "\x1b[40m",
  }

  export function ansi(color: HighContrastColorType): string {
    return ansiHighContrastMap[color]
  }

  export function apply(text: string, color: HighContrastColorType): string {
    return `${ansiHighContrastMap[color]}${text}\x1b[0m`
  }
}
