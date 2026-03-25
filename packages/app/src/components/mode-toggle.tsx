import { useLayout } from "@/context/layout"
import { useLanguage } from "@/context/language"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { Spinner } from "@opencode-ai/ui/spinner"
import { useParams } from "@solidjs/router"
import { createSignal, startTransition, Show } from "solid-js"

export function ModeToggle() {
  const layout = useLayout()
  const language = useLanguage()
  const params = useParams()
  const [pending, setPending] = createSignal(false)

  const disabled = () => !params.dir || pending()

  const toggle = () => {
    if (disabled()) return
    
    setPending(true)
    startTransition(() => {
      layout.setMode(layout.mode() === "ide" ? "ade" : "ide")
    }).then(() => {
      // Small delay to ensure render has a chance to breathe
      setTimeout(() => setPending(false), 100)
    })
  }

  const tooltipValue = () => {
    if (pending()) return "Switching modes..."
    if (!params.dir) return "Open a project to enable ADE mode"
    return layout.mode() === "ide" ? "Switch to ADE (Agent Development Environment)" : "Switch to IDE"
  }

  const active = () => layout.mode() === "ade"

  return (
    <Tooltip
      placement="right"
      value={tooltipValue()}
    >
      <button
        onClick={toggle}
        disabled={disabled()}
        class="group relative flex flex-col items-center w-[30px] h-[52px] rounded-[10px] transition-all duration-300 focus:outline-none border-none shrink-0 overflow-hidden"
        style={{
          "background-color": active() ? "var(--icon-success-base)" : "var(--surface-raised-base)",
        }}
        classList={{
          "opacity-50 cursor-not-allowed": !params.dir,
          "hover:brightness-105 active:scale-95": !disabled()
        }}
      >
        {/* Background Hint Icons */}
        <div class="absolute inset-0 flex flex-col items-center justify-between py-2.5 pointer-events-none opacity-30">
           <Icon name="code" class="size-[12px]" style={{ color: active() ? "var(--icon-success-active)" : "var(--text-weak-base)" }} />
           <Icon name="console" class="size-[12px]" style={{ color: active() ? "var(--icon-success-active)" : "var(--text-weak-base)" }} />
        </div>

        {/* Moving Square Thumb */}
        <div
          class="absolute top-[3px] w-[24px] h-[24px] rounded-[6px] transition-all duration-300 flex items-center justify-center z-10"
          style={{
            "background-color": "rgba(255, 255, 255, 0.4)",
            "backdrop-filter": "blur(4px)",
            "box-shadow": "0 2px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2)",
            transform: active() ? "translateY(22px)" : "translateY(0px)"
          }}
        >
          <Show 
            when={!pending()} 
            fallback={<Spinner class="size-[14px] text-text-strong" />}
          >
            <Icon
              name={active() ? "console" : "code"}
              class="size-[14px]"
              style={{
                color: active() ? "var(--icon-success-active)" : "var(--text-strong-base)"
              }}
            />
          </Show>
        </div>
      </button>
    </Tooltip>
  )
}