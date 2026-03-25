# Phase 3: UI Enhancement

**Duration:** Week 5-6  
**Status:** In Progress  
**Depends on:** Phase 1 (Foundation), Phase 2 (Memory Engine)

---

## Objectives

- Implement blue-themed terminal UI
- Create rounded activity area components
- Build memory visualization widgets
- Add agent status displays
- Implement smooth animations

---

## Tasks

### 3.1 Color System

- [x] Define Orca color palette
- [x] Create color utility functions
- [x] Implement color application helpers
- [ ] Add High Contrast mode support ✅ (implemented, needs integration)
- [x] Create color export system

### 3.2 Box Drawing

- [x] Implement rounded box renderer
- [x] Add double-line box style
- [x] Create solid box style ✅ (fixed bug: bottomRight was ╘, now ┘)
- [x] Implement nested box handling
- [x] Add box width/height constraints

### 3.3 Text Styling

- [x] Create text formatter (bold, italic, underline)
- [x] Implement gradient text
- [x] Add text alignment helpers
- [x] Create text truncation utilities
- [x] Implement text wrapping ✅ (added wrap, wrapWithIndent)

### 3.4 Core Components

#### Activity Card

- [x] Design activity card structure
- [x] Implement status indicators
- [x] Add collapsible content
- [x] Create animation for state changes
- [x] Handle overflow/scrolling

#### Status Indicator

- [x] Design status icons
- [x] Implement pulse animation
- [x] Add color coding for states
- [x] Create size variants
- [x] Implement keyboard indicators

#### Memory Widget

- [x] Design memory panel layout
- [x] Show category breakdown
- [x] Display recent access
- [x] Add memory count badge
- [x] Implement mini-mode

#### Agent Status Panel

- [x] Design agent list layout
- [x] Show agent types
- [x] Display current tasks
- [x] Add completion counts
- [x] Implement status filtering

#### Progress Bar

- [x] Design progress bar styles
- [x] Implement solid fill
- [x] Add gradient animation
- [x] Create segment style
- [ ] Handle indeterminate state

#### Command Palette

- [x] Design command input
- [x] Implement autocomplete
- [x] Add history navigation
- [x] Show suggestions
- [ ] Handle multi-line input

### 3.5 Layout System

- [x] Create main view layout
- [x] Implement split view for memory panel
- [x] Add responsive width adaptation
- [x] Create compact mode
- [x] Handle terminal resize

### 3.6 Animations

- [x] Implement pulse effect (status indicators)
- [x] Add spinner animations (progress)
- [ ] Create fade transitions
- [ ] Implement slide animations
- [ ] Handle reduced motion preference

### 3.7 Output Formatting

- [ ] Format memory output
- [ ] Format agent status
- [ ] Format tool results
- [ ] Create error formatting
- [ ] Implement JSON pretty-print

---

## Deliverables

| Deliverable       | Description                      | Status         |
| ----------------- | -------------------------------- | -------------- |
| Color System      | Full color palette and utilities | ✅ Done        |
| Box Drawing       | Rounded/solid box rendering      | ✅ Done        |
| Activity Card     | Main display component           | ✅ Done        |
| Status Indicators | Animated status display          | ✅ Done        |
| Memory Widget     | Memory visualization             | ✅ Done        |
| Agent Panel       | Multi-agent status               | ✅ Done        |
| Layout System     | Responsive terminal layouts      | ✅ Done        |
| Animations        | Smooth UI animations             | ⚠️ Partial     |
| Output Formatting | Formatted output for display     | 🔄 In Progress |

---

## Component Specifications

### Activity Card

```typescript
interface ActivityCardProps {
  title: string
  status: "pending" | "active" | "completed" | "error" | "warning"
  content: string
  timestamp: Date
  duration?: number
  icon?: string
  collapsible?: boolean
  variant?: "default" | "compact" | "detailed"
}

// ANSI rendering
function renderActivityCard(props: ActivityCardProps): string {
  const borderColor = STATUS_COLORS[props.status]
  const statusIcon = STATUS_ICONS[props.status]

  const lines = [
    `╭${"─".repeat(width - 2)}╮`,
    `│ ${statusIcon} ${props.status.padEnd(10)} ${props.title} │`,
    `├${"─".repeat(width - 2)}┤`,
    `│ ${wrapText(props.content, width - 4)} │`,
  ]

  if (props.duration) {
    lines.push(`│ Duration: ${props.duration}ms │`)
  }

  lines.push(`╰${"─".repeat(width - 2)}╯`)

  return applyBorderColor(lines.join("\n"), borderColor)
}
```

### Memory Widget

```typescript
interface MemoryWidgetProps {
  totalMemories: number
  categories: Map<MemoryCategory, number>
  recentAccess: string[]
  mode: "full" | "compact" | "mini"
}

function renderMemoryWidget(props: MemoryWidgetProps): string {
  if (props.mode === "mini") {
    return `┌─Memory─┐\n│ ${props.totalMemories.toString().padStart(4)} │\n└────────┘`
  }

  // Full/compact mode rendering
  const categoryBars = Array.from(props.categories.entries())
    .map(([cat, count]) => `  ${cat.padEnd(12)} ${renderBar(count)}`)
    .join("\n")

  return `
┌─────────────────────┐
│ Memory: ${props.totalMemories.toString().padStart(5)}       │
├─────────────────────┤
${categoryBars}
├─────────────────────┤
│ Recent:             │
${props.recentAccess
  .slice(0, 3)
  .map((r) => `│ • ${r.slice(0, 16)} │`)
  .join("\n")}
└─────────────────────┘
  `
}
```

---

## Color Palette

```typescript
export const ORCA_COLORS = {
  // Primary blues
  primary: {
    main: "#0066CC",
    light: "#3399FF",
    dark: "#004080",
    bg: "#0A1628",
  },

  // Accent cyan
  accent: {
    main: "#00D4FF",
    glow: "#00D4FF40",
  },

  // Status colors
  status: {
    idle: "#94A3B8", // Gray
    active: "#00D4FF", // Cyan
    thinking: "#0066CC", // Blue
    success: "#10B981", // Green
    warning: "#F59E0B", // Amber
    error: "#EF4444", // Red
  },

  // Surfaces
  surface: {
    dark: "#0A1628",
    panel: "#0F1F35",
    card: "#142540",
    hover: "#1A3A5C",
  },

  // Borders
  border: {
    default: "#1A3A5C",
    focus: "#3399FF",
    glow: "#0066CC50",
  },

  // Text
  text: {
    primary: "#FFFFFF",
    secondary: "#94A3B8",
    muted: "#64748B",
  },
}
```

---

## ANSI Escape Codes

```typescript
export const ANSI = {
  // Colors
  color: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bg: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,

  // Styles
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  reset: "\x1b[0m",

  // Cursor
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
  moveTo: (x: number, y: number) => `\x1b[${y};${x}H`,
  clearLine: "\x1b[2K",
  clearScreen: "\x1b[2J",

  // Box drawing
  box: {
    rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
    solid: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
    double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  },
}
```

---

## Testing

### Visual Tests

- [ ] Box drawing displays correctly
- [ ] Colors render properly in supported terminals
- [ ] Animations play smoothly
- [ ] Layout adapts to terminal width
- [ ] Components render in isolation

### Compatibility Tests

- [ ] Works in macOS Terminal
- [ ] Works in iTerm2
- [ ] Works in Windows Terminal
- [ ] Works in VS Code terminal
- [ ] Graceful degradation in limited terminals

---

## Success Criteria

- [x] Blue theme displays consistently
- [x] Rounded corners render correctly
- [x] Status indicators animate smoothly
- [x] Memory widget shows accurate data
- [x] Agent panel displays all agents
- [x] Layout adapts to terminal width
- [ ] Animations respect reduced motion
- [ ] Performance: < 16ms render time
