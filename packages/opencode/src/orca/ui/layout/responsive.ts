export type LayoutMode = "compact" | "normal" | "wide"

export interface LayoutConfig {
  mode: LayoutMode
  showMemoryPanel: boolean
  showAgentPanel: boolean
  maxWidth: number
  compactCards: boolean
}

const MIN_WIDTH = 80
const COMPACT_WIDTH = 100
const FULL_WIDTH = 140

export function getLayoutMode(): LayoutMode {
  const width = process.stdout.columns ?? 80

  if (width < MIN_WIDTH) return "compact"
  if (width < FULL_WIDTH) return "normal"
  return "wide"
}

export function getLayoutConfig(mode?: LayoutMode): LayoutConfig {
  const effectiveMode = mode ?? getLayoutMode()

  switch (effectiveMode) {
    case "compact":
      return {
        mode: "compact",
        showMemoryPanel: false,
        showAgentPanel: false,
        maxWidth: 76,
        compactCards: true,
      }
    case "normal":
      return {
        mode: "normal",
        showMemoryPanel: false,
        showAgentPanel: true,
        maxWidth: 120,
        compactCards: false,
      }
    case "wide":
      return {
        mode: "wide",
        showMemoryPanel: true,
        showAgentPanel: true,
        maxWidth: 160,
        compactCards: false,
      }
  }
}

export function getTerminalWidth(): number {
  return process.stdout.columns ?? 80
}

export function getTerminalHeight(): number {
  return process.stdout.rows ?? 24
}

export function calculateContentWidth(config: LayoutConfig): number {
  const terminalWidth = getTerminalWidth()
  const usableWidth = Math.min(terminalWidth, config.maxWidth)

  if (config.showMemoryPanel && config.showAgentPanel) {
    return Math.floor((usableWidth - 4) / 2)
  }

  return usableWidth - 4
}

export interface ResponsiveOptions {
  preferWide?: boolean
  forceMode?: LayoutMode
}

export function getResponsiveConfig(options: ResponsiveOptions = {}): LayoutConfig {
  const { preferWide = false, forceMode } = options

  if (forceMode) {
    return getLayoutConfig(forceMode)
  }

  const width = process.stdout.columns ?? 80

  if (width < MIN_WIDTH) {
    return getLayoutConfig("compact")
  }

  if (preferWide && width >= FULL_WIDTH) {
    return getLayoutConfig("wide")
  }

  if (width >= FULL_WIDTH) {
    return getLayoutConfig("wide")
  }

  return getLayoutConfig("normal")
}

export namespace Responsive {
  export function getMode(): LayoutMode {
    return getLayoutMode()
  }

  export function getConfig(mode?: LayoutMode): LayoutConfig {
    return getLayoutConfig(mode)
  }

  export function getWidth(): number {
    return getTerminalWidth()
  }

  export function getHeight(): number {
    return getTerminalHeight()
  }

  export function getConfigFor(options: ResponsiveOptions = {}): LayoutConfig {
    return getResponsiveConfig(options)
  }
}
