import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { TextAttributes } from "@opentui/core"

import { selectedForeground, useTheme } from "@tui/context/theme"

import { OrcaBorder } from "../../component/border"

export function Header(props: { child?: boolean; onBack?: () => void }) {
  const { theme } = useTheme()
  const [stamp, setStamp] = createSignal(new Date().toISOString())

  onMount(() => {
    const timer = setInterval(() => setStamp(new Date().toISOString()), 1000)
    onCleanup(() => clearInterval(timer))
  })
  return (
    <box flexShrink={0} marginBottom={1} width="100%">
      <box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        backgroundColor={theme.primary}
        paddingLeft={1}
        paddingRight={1}
        width="100%"
      >
        <box flexDirection="row" gap={1} minWidth={1} flexShrink={1}>
          <Show when={props.child}>
            <box
              flexDirection="row"
              gap={1}
              alignItems="center"
              onMouseUp={() => props.onBack?.()}
              paddingRight={1}
              border={["right"]}
              borderColor={selectedForeground(theme, theme.primary)}
            >
              <text
                fg={selectedForeground(theme, theme.primary)}
                bg={theme.primary}
                attributes={TextAttributes.BOLD}
                wrapMode="none"
              >
                ESC
              </text>
              <text fg={selectedForeground(theme, theme.primary)} bg={theme.primary} wrapMode="none">
                Back
              </text>
            </box>
          </Show>
          <text fg={selectedForeground(theme, theme.primary)} bg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none">
            SESSION LOG
          </text>
          <text fg={selectedForeground(theme, theme.primary)} bg={theme.primary}>
            -
          </text>
          <text fg={selectedForeground(theme, theme.primary)} bg={theme.primary} wrapMode="none">
            {stamp()}
          </text>
        </box>
        <text fg={selectedForeground(theme, theme.primary)} bg={theme.primary} attributes={TextAttributes.BOLD} wrapMode="none" flexShrink={0}>
          ORCA
        </text>
      </box>
    </box>
  )
}
