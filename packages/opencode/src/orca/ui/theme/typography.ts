export namespace Typography {
  export const fontMono = '"JetBrains Mono", "Fira Code", "Consolas", monospace'
  export const fontSans = '"Inter", "Segoe UI", system-ui, sans-serif'

  export const textXs = "0.75rem"
  export const textSm = "0.875rem"
  export const textBase = "1rem"
  export const textLg = "1.125rem"
  export const textXl = "1.25rem"
  export const text2xl = "1.5rem"

  export const leadingTight = 1.25
  export const leadingNormal = 1.5
  export const leadingRelaxed = 1.75

  export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
  export type LineHeight = "tight" | "normal" | "relaxed"

  const sizeMap: Record<TextSize, string> = {
    xs: textXs,
    sm: textSm,
    base: textBase,
    lg: textLg,
    xl: textXl,
    "2xl": text2xl,
  }

  const leadingMap: Record<LineHeight, number> = {
    tight: leadingTight,
    normal: leadingNormal,
    relaxed: leadingRelaxed,
  }

  export function size(name: TextSize): string {
    return sizeMap[name]
  }

  export function leading(name: LineHeight): number {
    return leadingMap[name]
  }
}
