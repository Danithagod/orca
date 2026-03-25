# Orca UI Specification

## Overview

Distinctive terminal UI with blue theme and rounded elements that differentiates Orca from standard CLI tools.

---

## Design System

### Color Palette

```css
/* Primary Colors */
--orca-primary: #0066cc; /* Main blue */
--orca-primary-light: #3399ff; /* Accent blue */
--orca-primary-dark: #004080; /* Deep blue */
--orca-primary-bg: #0a1628; /* Background */

/* Accent Colors */
--orca-accent: #00d4ff; /* Cyan highlight */
--orca-accent-glow: #00d4ff40; /* Glow effect */
--orca-success: #10b981; /* Green success */
--orca-warning: #f59e0b; /* Amber warning */
--orca-error: #ef4444; /* Red error */

/* Surface Colors */
--orca-surface-dark: #0a1628; /* Dark surface */
--orca-surface-panel: #0f1f35; /* Panel surface */
--orca-surface-card: #142540; /* Card surface */
--orca-surface-hover: #1a3a5c; /* Hover state */

/* Border Colors */
--orca-border-default: #1a3a5c;
--orca-border-focus: #3399ff;
--orca-border-glow: #0066cc50;

/* Text Colors */
--orca-text-primary: #ffffff;
--orca-text-secondary: #94a3b8;
--orca-text-muted: #64748b;

/* Gradient Definitions */
--orca-gradient-primary: linear-gradient(135deg, #0066cc 0%, #3399ff 100%);
--orca-gradient-glow: radial-gradient(circle, #00d4ff20 0%, transparent 70%);
```

### Typography

```css
/* Font Stack */
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
--font-sans: "Inter", "Segoe UI", system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px; /* Primary rounded corners */
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px; /* Pills and circles */
```

---

## Components

### 1. Activity Card

Primary container for displaying tool executions, agent actions, and system messages.

```
┌─────────────────────────────────────────────────────┐
│  ◉ Active    Read file    src/index.ts             │
│  ───────────────────────────────────────────────   │
│  Reading configuration file...                      │
│  ───────────────────────────────────────────────   │
│  ✓ Complete    234ms                               │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
interface ActivityCardProps {
  title: string
  status: "pending" | "active" | "completed" | "error" | "warning"
  content: string
  timestamp: Date
  duration?: number
  icon?: string
  collapsible?: boolean
}

// ANSI escape codes for rounded corners
const ROUNDED_TOP_LEFT = "╭"
const ROUNDED_TOP_RIGHT = "╮"
const ROUNDED_BOTTOM_LEFT = "╰"
const ROUNDED_BOTTOM_RIGHT = "╯"
const HORIZONTAL = "─"
const VERTICAL = "│"
```

### 2. Status Indicator

Visual status indicators with animation support.

```typescript
interface StatusIndicatorProps {
  status: "idle" | "thinking" | "active" | "error" | "success"
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

// Status indicators
const STATUS_ICONS = {
  idle: "○",
  thinking: "◎", // Pulsing animation
  active: "◉", // Bright animation
  error: "✗",
  success: "✓",
}
```

### 3. Memory Widget

Compact display of memory status.

```
┌─────────────────────┐
│  Memory             │
│  ┌───────┐          │
│  │ 23    │ entries  │
│  └───────┘          │
│  bow: architecture  │
│  • conventions      │
│  • decisions        │
└─────────────────────┘
```

```typescript
interface MemoryWidgetProps {
  totalMemories: number
  categories: Map<string, number>
  recentAccess: string[]
  compact?: boolean
}
```

### 4. Agent Status Panel

Multi-agent status display.

```
┌─────────────────────────────────────┐
│  Agents                             │
│  ─────────────────────────────────  │
│  ◉ Architect    Active              │
│  ○ Builder      Idle                │
│  ○ Tester       Idle                │
│  ◉ Memory Keeper Active (2)         │
└─────────────────────────────────────┘
```

```typescript
interface AgentStatusPanelProps {
  agents: Array<{
    id: string
    name: string
    status: "idle" | "active" | "error"
    tasksCompleted: number
    currentTask?: string
  }>
}
```

### 5. Progress Bar

Animated progress indicator.

```typescript
interface ProgressBarProps {
  percent: number
  label?: string
  width?: number
  style?: "solid" | "gradient" | "segments"
}

// Rendering
function renderProgressBar(props: ProgressBarProps): string {
  const filled = Math.round((props.percent / 100) * props.width)
  const empty = props.width - filled

  const fillChar = props.style === "segments" ? "▓" : "█"
  const emptyChar = props.style === "segments" ? "░" : "░"

  const bar = fillChar.repeat(filled) + emptyChar.repeat(empty)

  // Apply gradient coloring for filled portion
  return applyGradient(bar, props.percent)
}
```

### 6. Command Palette

Interactive command input with autocomplete.

```
┌─────────────────────────────────────────────┐
│  ╭───────────────────────────────────────  │
│  │ /memory recall "authentication"        │  │
│  ╰───────────────────────────────────────  │
│  ────────────────────────────────────────  │
│  Suggestions:                               │
│  ► /memory recall authentication            │
│    /memory recall session                   │
│    /memory store                            │
└─────────────────────────────────────────────┘
```

---

## Layout

### Main View Structure

```
╔═══════════════════════════════════════════════════════════════╗
║  ORCA                                    Memory: 23  Agents: 3 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  Activity Area                                       │    ║
║  │  ────────────────────────────────────────────────── │    ║
║  │                                                      │    ║
║  │  [Cards appear here with rounded corners]           │    ║
║  │                                                      │    ║
║  │                                                      │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  ╭─────────────────────────────────────────────────────────╮ ║
║  │ Input > _______________________________________________ │ ║
║  ╰─────────────────────────────────────────────────────────╯ ║
╚═══════════════════════════════════════════════════════════════╝
```

### Split View (Memory Panel)

```
╔════════════════════════════════════════╦════════════════╗
║  Activity Area                         ║  Memory Panel  ║
║  ────────────────────────────────      ║  ───────────── ║
║                                         ║  Recent:      ║
║  [Activity cards...]                    ║  • auth flow  ║
║                                         ║  • db schema  ║
║                                         ║  • api design ║
║                                         ║               ║
║                                         ║  Categories:  ║
║                                         ║  arch (8)     ║
║                                         ║  conv (15)    ║
╚════════════════════════════════════════╩════════════════╝
```

---

## Rendering

### Terminal Box Drawing

```typescript
const BOX = {
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
}

function createRoundedBox(content: string[], width: number, options?: BoxOptions): string[] {
  const { style = "rounded", padding = 1 } = options ?? {}
  const chars = BOX[style]

  const topBorder = chars.topLeft + chars.horizontal.repeat(width - 2) + chars.topRight
  const bottomBorder = chars.bottomLeft + chars.horizontal.repeat(width - 2) + chars.bottomRight

  const paddedContent = content.map((line) => {
    const paddedLine = line.padEnd(width - 2 - padding * 2)
    return chars.vertical + " ".repeat(padding) + paddedLine + " ".repeat(padding) + chars.vertical
  })

  return [topBorder, ...paddedContent, bottomBorder]
}
```

### Color Application

```typescript
function applyColor(text: string, colorType: ColorType): string {
  const colors = {
    primary: "\x1b[38;5;33m", // Blue
    accent: "\x1b[38;5;45m", // Cyan
    success: "\x1b[38;5;40m", // Green
    warning: "\x1b[38;5;214m", // Orange
    error: "\x1b[38;5;196m", // Red
    muted: "\x1b[38;5;246m", // Gray
    reset: "\x1b[0m",
  }

  return `${colors[colorType]}${text}${colors.reset}`
}

function applyGradient(text: string, percent: number): string {
  // Gradient from primary to accent based on percentage
  const startColor = { r: 0, g: 102, b: 204 }
  const endColor = { r: 0, g: 212, b: 255 }

  const r = Math.round(startColor.r + (endColor.r - startColor.r) * (percent / 100))
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * (percent / 100))
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * (percent / 100))

  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
}
```

---

## Animation

### Pulse Effect

```typescript
let pulseFrame = 0
const PULSE_CHARS = ["○", "◎", "●", "◎"]

function renderPulse(): string {
  const frame = PULSE_CHARS[pulseFrame % PULSE_CHARS.length]
  pulseFrame++
  return applyColor(frame, "accent")
}

function startPulseAnimation(interval: number = 300): NodeJS.Timeout {
  return setInterval(() => {
    // Re-render pulse indicator
    render()
  }, interval)
}
```

### Progress Animation

```typescript
const PROGRESS_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

let progressFrame = 0

function renderProgressSpinner(): string {
  const frame = PROGRESS_FRAMES[progressFrame % PROGRESS_FRAMES.length]
  progressFrame++
  return applyColor(frame, "primary")
}
```

---

## Responsive Behavior

### Terminal Width Detection

```typescript
const MIN_WIDTH = 80
const COMPACT_WIDTH = 100
const FULL_WIDTH = 140

function getLayoutMode(): "compact" | "normal" | "wide" {
  const width = process.stdout.columns ?? 80

  if (width < MIN_WIDTH) return "compact"
  if (width < FULL_WIDTH) return "normal"
  return "wide"
}

function adaptLayout(mode: LayoutMode): LayoutConfig {
  switch (mode) {
    case "compact":
      return {
        showMemoryPanel: false,
        showAgentPanel: false,
        maxWidth: 76,
        compactCards: true,
      }
    case "normal":
      return {
        showMemoryPanel: false,
        showAgentPanel: true,
        maxWidth: 120,
        compactCards: false,
      }
    case "wide":
      return {
        showMemoryPanel: true,
        showAgentPanel: true,
        maxWidth: 160,
        compactCards: false,
      }
  }
}
```

---

## Accessibility

1. **High Contrast Mode**: Alternative color scheme for visibility
2. **Reduced Motion**: Disable animations when requested
3. **Screen Reader Support**: Semantic markers for accessibility tools

```typescript
interface AccessibilityOptions {
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
}

function getThemeColors(options: AccessibilityOptions): ColorScheme {
  if (options.highContrast) {
    return {
      primary: "\x1b[38;5;33m",
      // Higher contrast variants
    }
  }
  return DEFAULT_COLORS
}
```

---

## File Structure

```
packages/opencode/src/orca/ui/
├── index.ts
├── components/
│   ├── activity-card.ts
│   ├── status-indicator.ts
│   ├── memory-widget.ts
│   ├── agent-panel.ts
│   ├── progress-bar.ts
│   └── command-palette.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── renderer/
│   ├── box.ts
│   ├── text.ts
│   ├── gradient.ts
│   └── animation.ts
└── layout/
    ├── main-view.ts
    ├── split-view.ts
    └── responsive.ts
```
