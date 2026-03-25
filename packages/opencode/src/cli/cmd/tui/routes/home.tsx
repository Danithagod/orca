import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createMemo, Match, onMount, Show, Switch } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { useKeybind } from "@tui/context/keybind"
import { TextAttributes, RGBA } from "@opentui/core"
import { Logo } from "../component/logo"
import { Tips } from "../component/tips"
import { Locale } from "@/util/locale"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useDirectory } from "../context/directory"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { Installation } from "@/installation"
import { useKV } from "../context/kv"
import { useCommandDialog } from "../component/dialog-command"
import { KiloNews } from "@/kilocode/components/kilo-news" // kilocode_change
import { useConnected } from "../component/dialog-model" // kilocode_change
import { OrcaCard, OrcaPanel, OrcaStatusBadge } from "../component/orca-ui" // kilocode_change

// TODO: what is the best way to do this?
let once = false

export function Home() {
  const sync = useSync()
  const kv = useKV()
  const { theme } = useTheme()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const command = useCommandDialog()
  const mcp = createMemo(() => Object.keys(sync.data.mcp).length > 0)
  const mcpError = createMemo(() => {
    return Object.values(sync.data.mcp).some((x) => x.status === "failed")
  })

  const connectedMcpCount = createMemo(() => {
    return Object.values(sync.data.mcp).filter((x) => x.status === "connected").length
  })

  const isFirstTimeUser = createMemo(() => sync.data.session.length === 0)
  const tipsHidden = createMemo(() => kv.get("tips_hidden", false))
  const newsHidden = createMemo(() => kv.get("news_hidden", false)) // kilocode_change
  // kilocode_change start
  const connected = useConnected()
  const onboarding = createMemo(() => isFirstTimeUser() && !connected())
  // kilocode_change end
  const showTips = createMemo(() => {
    if (onboarding()) return !tipsHidden() // kilocode_change - show onboarding tip
    // kilocode_change - don't hide tips for connected first-time users
    return !tipsHidden()
  })

  command.register(() => [
    {
      title: tipsHidden() ? "Show tips" : "Hide tips",
      value: "tips.toggle",
      keybind: "tips_toggle",
      category: "System",
      onSelect: (dialog) => {
        kv.set("tips_hidden", !tipsHidden())
        dialog.clear()
      },
    },
    // kilocode_change start
    {
      title: newsHidden() ? "Show news" : "Hide news",
      value: "news.toggle",
      keybind: "news_toggle",
      category: "System",
      onSelect: (dialog) => {
        kv.set("news_hidden", !newsHidden())
        dialog.clear()
      },
    },
    // kilocode_change end
  ])

  const Hint = (
    <Show when={connectedMcpCount() > 0}>
      <box flexShrink={0} flexDirection="row" gap={1}>
        <text fg={theme.text}>
          <Switch>
            <Match when={mcpError()}>
              <span style={{ fg: theme.error }}>•</span> mcp errors{" "}
              <span style={{ fg: theme.textMuted }}>ctrl+x s</span>
            </Match>
            <Match when={true}>
              <span style={{ fg: theme.success }}>•</span>{" "}
              {Locale.pluralize(connectedMcpCount(), "{} mcp server", "{} mcp servers")}
            </Match>
          </Switch>
        </text>
      </box>
    </Show>
  )

  let prompt: PromptRef
  const args = useArgs()
  onMount(() => {
    if (once) return
    if (route.initialPrompt) {
      prompt.set(route.initialPrompt)
      once = true
    } else if (args.prompt) {
      prompt.set({ input: args.prompt, parts: [] })
      once = true
      prompt.submit()
    }
  })
  const directory = useDirectory()

  const keybind = useKeybind()
  return (
    <>
      <box flexGrow={1} alignItems="center" paddingLeft={4} paddingRight={4} justifyContent="center">
        <box width="100%" maxWidth={85}>
          <OrcaPanel title="ORCA" borderStyle="rounded" borderColor={theme.accent} padding={2}>
            <box alignItems="center" width="100%">
              <box marginBottom={2}>
                <Logo />
              </box>

              <box width="100%" maxWidth={75} zIndex={1000} marginBottom={2}>
                <Prompt
                  ref={(r) => {
                    prompt = r
                    promptRef.set(r)
                  }}
                  hint={Hint}
                />
              </box>

              <box width="100%" maxWidth={75} flexDirection="row" gap={2}>
                <Show when={!newsHidden()}>
                  <box flexGrow={1} flexBasis={0}>
                    <KiloNews />
                  </box>
                </Show>
                <Show when={showTips()}>
                  <box flexGrow={1} flexBasis={0}>
                    <Tips
                      tip={
                        onboarding()
                          ? "Using a free model \u2014 run {highlight}/connect{/highlight} to add your API key"
                          : undefined
                      }
                    />
                  </box>
                </Show>
              </box>
            </box>
          </OrcaPanel>
        </box>
        <Toast />
      </box>

      <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexDirection="row" flexShrink={0} gap={2} backgroundColor={theme.backgroundPanel}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD}>
          Orca
        </text>

        <text fg={theme.textMuted}>│</text>
        <text fg={theme.textMuted}>{directory()}</text>
        <box gap={1} flexDirection="row" flexShrink={0}>
          <Show when={mcp()}>
            <OrcaStatusBadge
              status={mcpError() ? "error" : connectedMcpCount() > 0 ? "success" : "idle"}
              label={`${connectedMcpCount()} MCP`}
            />
            <text fg={theme.textMuted}>/status</text>
          </Show>
        </box>
        <box flexGrow={1} />
        <box flexShrink={0}>
          <text fg={theme.accent}>v{Installation.VERSION}</text>
        </box>
      </box>
    </>
  )
}
