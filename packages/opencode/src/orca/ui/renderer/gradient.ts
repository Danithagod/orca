const START_COLOR = { r: 0, g: 102, b: 204 }
const END_COLOR = { r: 0, g: 212, b: 255 }

export function applyGradient(text: string, percent: number): string {
  const r = Math.round(START_COLOR.r + (END_COLOR.r - START_COLOR.r) * (percent / 100))
  const g = Math.round(START_COLOR.g + (END_COLOR.g - START_COLOR.g) * (percent / 100))
  const b = Math.round(START_COLOR.b + (END_COLOR.b - START_COLOR.b) * (percent / 100))

  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
}

export function gradientPercent(percent: number): { r: number; g: number; b: number } {
  return {
    r: Math.round(START_COLOR.r + (END_COLOR.r - START_COLOR.r) * (percent / 100)),
    g: Math.round(START_COLOR.g + (END_COLOR.g - START_COLOR.g) * (percent / 100)),
    b: Math.round(START_COLOR.b + (END_COLOR.b - START_COLOR.b) * (percent / 100)),
  }
}

export function hexGradient(percent: number): string {
  const { r, g, b } = gradientPercent(percent)
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

export function ansiGradient(percent: number): string {
  const { r, g, b } = gradientPercent(percent)
  return `\x1b[38;2;${r};${g};${b}m`
}

export function applyMultiColorGradient(text: string, colors: Array<{ r: number; g: number; b: number }>): string {
  if (colors.length === 0) return text
  if (colors.length === 1) return `\x1b[38;2;${colors[0].r};${colors[0].g};${colors[0].b}m${text}\x1b[0m`

  const segments: string[] = []
  const segmentLength = text.length / colors.length

  for (let i = 0; i < colors.length; i++) {
    const { r, g, b } = colors[i]
    const start = Math.floor(i * segmentLength)
    const end = Math.floor((i + 1) * segmentLength)
    const segment = text.slice(start, end)
    segments.push(`\x1b[38;2;${r};${g};${b}m${segment}`)
  }

  return segments.join("") + "\x1b[0m"
}
