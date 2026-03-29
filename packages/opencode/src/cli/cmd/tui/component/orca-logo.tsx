import { TextAttributes } from "@opentui/core"
import { useTheme } from "@tui/context/theme"

export function OrcaLogo() {
  const { theme } = useTheme()
  return (
    <box flexDirection="column" alignItems="center" gap={0.5}>
      <text fg={theme.primary} selectable={false} attributes={TextAttributes.BOLD}>
        ORCA
      </text>
      <text fg={theme.textMuted} selectable={false}>
        command console
      </text>
    </box>
  )
}

export function OrcaMiniLogo() {
  const { theme } = useTheme()
  return (
    <box>
      <text fg={theme.primary} selectable={false} attributes={TextAttributes.BOLD}>
        ORCA
      </text>
    </box>
  )
}

export { OrcaLogo as KiloLogo }
