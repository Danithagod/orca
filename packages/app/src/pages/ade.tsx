import { For, Show, createEffect, createMemo, on } from "solid-js"
import { useTerminal } from "@/context/terminal"
import { Terminal } from "@/components/terminal"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { focusTerminalById } from "@/pages/session/helpers"

export default function AdeView() {
  const terminal = useTerminal()
  const meta = { created: false }

  const terminalList = createMemo(() => terminal.all().slice(0, 16))

  createEffect(() => {
    if (!terminal.ready()) return
    if (terminalList().length !== 0) return
    if (meta.created) return
    meta.created = true
    terminal.new()
  })

  createEffect(
    on(
      () => terminalList().map((pty) => pty.id),
      (next, prev) => {
        if (!prev || next.length <= prev.length) return
        const id = next[next.length - 1]
        if (!id) return
        setTimeout(() => focusTerminalById(id), 0)
      },
    ),
  )

  const gridClass = createMemo(() => {
    const count = terminalList().length
    if (count <= 1) return "grid-cols-1 grid-rows-1"
    if (count <= 2) return "grid-cols-2 grid-rows-1"
    if (count <= 4) return "grid-cols-2 grid-rows-2"
    if (count <= 6) return "grid-cols-3 grid-rows-2"
    if (count <= 9) return "grid-cols-3 grid-rows-3"
    if (count <= 12) return "grid-cols-4 grid-rows-3"
    return "grid-cols-4 grid-rows-4"
  })

  return (
    <div class="size-full bg-background-stronger p-4 flex flex-col gap-4 overflow-hidden">
      <div class="flex items-center justify-between shrink-0">
        <h2 class="text-14-medium text-text-strong">ADE: Agent Development Environment</h2>
        <div class="flex items-center gap-2">
          <Tooltip value="Add Terminal">
            <IconButton
              icon="plus"
              variant="ghost"
              onClick={() => terminal.new()}
              disabled={terminalList().length >= 16}
            />
          </Tooltip>
        </div>
      </div>

      <Show
        when={terminal.ready()}
        fallback={
          <div class="flex-1 min-h-0 flex items-center justify-center text-text-weak">Loading terminals...</div>
        }
      >
        <div class={`flex-1 min-h-0 grid gap-4 ${gridClass()}`}>
          <For each={terminalList()}>
            {(pty) => (
              <div
                id={`terminal-wrapper-${pty.id}`}
                class="relative group rounded-xl border border-border-weak-base bg-background-base shadow-lg overflow-hidden flex flex-col transition-all hover:border-primary-base"
              >
                <div class="shrink-0 h-8 flex items-center justify-between px-3 bg-surface-base border-b border-border-weaker-base">
                  <span class="text-12-medium text-text-base truncate">{pty.title}</span>
                  <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      icon="close-small"
                      variant="ghost"
                      class="h-6 w-6"
                      onClick={() => terminal.close(pty.id)}
                    />
                  </div>
                </div>
                <div class="flex-1 min-h-0">
                  <Terminal
                    pty={pty}
                    class="size-full"
                    onConnect={() => terminal.trim(pty.id)}
                    onCleanup={terminal.update}
                    onConnectError={() => terminal.clone(pty.id)}
                  />
                </div>
              </div>
            )}
          </For>
          <Show when={terminalList().length === 0}>
            <div class="col-span-full row-span-full flex flex-col items-center justify-center gap-4 text-text-weak">
              <div class="text-14-regular">No terminals active in ADE.</div>
              <IconButton icon="plus" variant="primary" size="large" onClick={() => terminal.new()}>
                Open First Terminal
              </IconButton>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
