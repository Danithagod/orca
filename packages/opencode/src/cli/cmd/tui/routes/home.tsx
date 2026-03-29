import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createMemo, Match, onMount, Show, Switch } from "solid-js"
import { TextAttributes } from "@opentui/core"
import path from "path"

import { useTheme } from "@tui/context/theme"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useDirectory } from "../context/directory"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useKV } from "../context/kv"
import { useCommandDialog } from "../component/dialog-command"
import { useConnected } from "../component/dialog-model"
import { KiloNews } from "@/kilocode/components/kilo-news"
import { Tips } from "../component/tips"
import { Logo } from "../component/logo"
import { OrcaMiniLogo } from "../component/orca-logo"
import { OrcaDots, OrcaPanel, OrcaStatusBadge } from "../component/orca-ui"

let once = false

export function Home() {
  const sync = useSync()
  const kv = useKV()
  const { theme } = useTheme()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const command = useCommandDialog()
  const args = useArgs()
  const directory = useDirectory()
  const connected = useConnected()

  const connectedMcpCount = createMemo(
    () => Object.values(sync.data.mcp).filter((x) => x.status === "connected").length,
  )
  const mcpError = createMemo(() => Object.values(sync.data.mcp).some((x) => x.status === "failed"))
  const isFirstTimeUser = createMemo(() => sync.data.session.length === 0)
  const tipsHidden = createMemo(() => kv.get("tips_hidden", false))
  const newsHidden = createMemo(() => kv.get("news_hidden", false))
  const onboarding = createMemo(() => isFirstTimeUser() && !connected())

  const showTips = createMemo(() => !tipsHidden())
  const stamp = createMemo(() => new Date().toISOString().replace(/\.\d+Z$/, "Z"))
  const dir = createMemo(() => {
    const parts = directory().split(path.sep).filter(Boolean)
    return parts.slice(-2).join(path.sep)
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
  ])

  let prompt: PromptRef
  onMount(() => {
    if (once) return
    if (route.initialPrompt) {
      prompt.set(route.initialPrompt)
      once = true
      return
    }
    if (args.prompt) {
      prompt.set({ input: args.prompt, parts: [] })
      once = true
      prompt.submit()
    }
  })

  return (
    <>
      <box flexGrow={1} flexDirection="row" paddingTop={1} paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
        <box flexGrow={1} minWidth={1}>
          <OrcaPanel variant="frame" bgColor="background" padding={1} footer={`Orca | ${directory()}`}>
            <box flexDirection="column" flexGrow={1} gap={1}>
              <box flexDirection="row" justifyContent="space-between" alignItems="center">
                <box flexDirection="row" gap={1}>
                  <text fg={theme.primary} attributes={TextAttributes.BOLD}>
                    ORCA CONSOLE
                  </text>
                  <text fg={theme.textMuted}>-</text>
                  <text fg={theme.textMuted}>{stamp()}</text>
                </box>
                <text fg={theme.text} attributes={TextAttributes.BOLD}>
                  ORCA
                </text>
              </box>
              <OrcaDots />

              <box flexGrow={1} flexDirection="column" alignItems="center" gap={1} paddingTop={1}>
                <box marginBottom={0.5}>
                  <Logo />
                </box>
                <box width="100%" maxWidth={104}>
                  <Prompt
                    ref={(r) => {
                      prompt = r
                      promptRef.set(r)
                    }}
                  />
                </box>

                <box width="100%" maxWidth={104} flexDirection="row" gap={1} alignItems="flex-start" marginTop={0.5}>
                  <Show when={!newsHidden()}>
                    <box flexGrow={1} flexBasis={0}>
                      <OrcaPanel title="NEWS" bgColor="element" variant="card" padding={1}>
                        <KiloNews />
                      </OrcaPanel>
                    </box>
                  </Show>
                  <Show when={showTips()}>
                    <box flexGrow={1} flexBasis={0}>
                      <OrcaPanel title="GUIDE" bgColor="element" variant="card" padding={1}>
                        <Tips
                          tip={
                            onboarding()
                              ? "Using a free model - run {highlight}/connect{/highlight} to add your API key"
                              : undefined
                          }
                        />
                      </OrcaPanel>
                    </box>
                  </Show>
                </box>
              </box>
            </box>
          </OrcaPanel>
        </box>

        <box width={44} flexDirection="column" gap={1}>
          <OrcaPanel bgColor="element" variant="card" padding={1} titleRight="ORCA">
            <box alignItems="center" gap={1}>
              <OrcaMiniLogo />
              <text fg={theme.textMuted}>New session</text>
              <text fg={theme.textMuted}>{stamp()}</text>
            </box>
          </OrcaPanel>

          <OrcaPanel title="STATUS" bgColor="panel" variant="card" padding={1}>
            <box flexDirection="column" gap={1}>
              <Switch>
                <Match when={onboarding()}>
                  <text fg={theme.textMuted} wrapMode="word">
                    Sign in or connect a provider to unlock more models and persistent account features.
                  </text>
                </Match>
                <Match when={true}>
                  <text fg={theme.textMuted} wrapMode="word">
                    Workspace ready. Start a session from the prompt and manage agents with the footer commands.
                  </text>
                </Match>
              </Switch>
              <OrcaStatusBadge
                status={connected() ? "success" : "warning"}
                label={connected() ? "connected" : "free mode"}
                uppercase={false}
              />
              <box flexDirection="row" justifyContent="space-between" alignItems="center">
                <text fg={theme.textMuted}>MCP</text>
                <OrcaStatusBadge
                  status={mcpError() ? "error" : connectedMcpCount() > 0 ? "success" : "idle"}
                  label={`${connectedMcpCount()}`}
                  uppercase={false}
                  size="sm"
                />
              </box>
            </box>
          </OrcaPanel>

          <OrcaPanel bgColor="panel" variant="card" padding={1} footer="ORCA /home">
            <box flexDirection="column" gap={0.5}>
              <OrcaDots rows={5} />
              <text fg={theme.textMuted}>DIR {dir()}</text>
              <text fg={theme.primary} attributes={TextAttributes.BOLD}>
                ORCA local
              </text>
            </box>
          </OrcaPanel>
        </box>
        <Toast />
      </box>
    </>
  )
}
