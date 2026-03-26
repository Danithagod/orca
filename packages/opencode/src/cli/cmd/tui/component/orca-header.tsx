// kilocode_change - Orca Header Component
import { useTheme } from "@tui/context/theme"
import { TextAttributes } from "@opentui/core"
import { OrcaBorder } from "./border"

export function OrcaHeader() {
  const { theme } = useTheme()

  return (
    <box
      width="100%"
      height={3}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border={["bottom"]}
      borderColor={theme.border}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Left section: ORCA Logo & Version */}
      <box flexDirection="row" alignItems="center" gap={2}>
        <text fg={theme.primary} attributes={TextAttributes.BOLD}>
          ORCA_
        </text>
        <box
          border={["left", "right", "top", "bottom"]}
          borderColor={theme.border}
          paddingLeft={1}
          paddingRight={1}
          customBorderChars={OrcaBorder.solid}
        >
          <text fg={theme.textMuted}>
            ver 2.5
          </text>
        </box>
      </box>

      {/* Center section: System Indicators */}
      <box flexDirection="row" alignItems="center" gap={3}>
        <box flexDirection="row" gap={1} backgroundColor={theme.success} paddingLeft={1} paddingRight={1} border={["left", "right", "top", "bottom"]} borderColor={theme.success} customBorderChars={OrcaBorder.solid}>
          <text fg={theme.background} attributes={TextAttributes.BOLD}>
            ENGINE_ONLINE
          </text>
        </box>
        <box flexDirection="row" gap={1} backgroundColor={theme.accent} paddingLeft={1} paddingRight={1} border={["left", "right", "top", "bottom"]} borderColor={theme.accent} customBorderChars={OrcaBorder.solid}>
          <text fg={theme.background} attributes={TextAttributes.BOLD}>
            SCAN_SYSTEM
          </text>
        </box>
      </box>

      {/* Right section: Metadata */}
      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg={theme.textMuted}>
          SIGNAL:
        </text>
        <text fg={theme.primary} attributes={TextAttributes.BOLD}>
          ACTIVE
        </text>
        <text fg={theme.textMuted}> / </text>
        <text fg={theme.text}>
          {new Date().toLocaleTimeString()}
        </text>
        <text fg={theme.textMuted}> / </text>
        <text fg={theme.primary}>
          MOD-03 {'>'} 25
        </text>
        <text fg={theme.textMuted}> / </text>
        <text fg={theme.success} attributes={TextAttributes.BOLD}>
          CORE__ACTIVE__
        </text>
      </box>
    </box>
  )
}
