// kilocode_change - Orca branding
import { For } from "solid-js"
import { useTheme } from "@tui/context/theme"

// Orca ASCII Logo - blocky shadowed style matching "CLAUDE CODE"
const ASCII_LOGO = [
  `  ██████╗  ██████╗   ██████╗   ████╗ `,
  ` ██╔═══██╗ ██╔══██╗ ██╔════╝  ██╔══██╗`,
  ` ██║   ██║ ██████╔╝ ██║       ███████║`,
  ` ██║   ██║ ██╔══██╗ ██║       ██╔══██║`,
  ` ╚██████╔╝ ██║  ██║ ╚██████╗  ██║  ██║`,
  `  ╚═════╝  ╚═╝  ╚═╝  ╚═════╝  ╚═╝  ╚═╝`,
]

export function OrcaLogo() {
  const { theme } = useTheme()

  return (
    <box>
      <For each={ASCII_LOGO}>
        {(line) => (
          <box flexDirection="row">
            <text fg={theme.accent} selectable={false}>
              {line}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}

// Mini version: compact yet retaining the blocky shadowed design
const MINI_LOGO = [
  ` ▄███▄ ████▄ ████▄  ▄███▄`,
  ` █   █ ██▄▄▀ ██     ██▄▄█`,
  ` ▀███▀ ██ ▀▄ ▀████  ██  █`,
]

export function OrcaMiniLogo() {
  const { theme } = useTheme()

  return (
    <box flexDirection="column" alignItems="center">
      <For each={MINI_LOGO}>
        {(line) => (
          <box flexDirection="row">
            <text fg={theme.accent} selectable={false}>
              {line}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}

// Backwards compatibility alias
export { OrcaLogo as KiloLogo }
