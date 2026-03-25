let prefersReducedMotion = false

export function setReducedMotion(enabled: boolean): void {
  prefersReducedMotion = enabled
}

export function getReducedMotion(): boolean {
  return prefersReducedMotion
}

export function shouldAnimate(): boolean {
  return !prefersReducedMotion
}

const PULSE_CHARS = ["○", "◎", "●", "◎"]
let pulseFrame = 0

export function renderPulse(): string {
  if (prefersReducedMotion) {
    return "●"
  }
  const frame = PULSE_CHARS[pulseFrame % PULSE_CHARS.length]
  pulseFrame++
  return frame
}

export function resetPulse(): void {
  pulseFrame = 0
}

const PROGRESS_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
let progressFrame = 0

export function renderProgressSpinner(): string {
  if (prefersReducedMotion) {
    return "⠋"
  }
  const frame = PROGRESS_FRAMES[progressFrame % PROGRESS_FRAMES.length]
  progressFrame++
  return frame
}

export function resetProgressSpinner(): void {
  progressFrame = 0
}

export interface AnimationState {
  frame: number
  running: boolean
  interval?: ReturnType<typeof setInterval>
}

const animations = new Map<string, AnimationState>()

export function startAnimation(
  id: string,
  renderFn: (frame: number) => string,
  callback: (output: string) => void,
  interval = 300,
): void {
  if (animations.has(id)) return
  if (prefersReducedMotion) {
    callback(renderFn(0))
    return
  }

  const state: AnimationState = {
    frame: 0,
    running: true,
  }

  state.interval = setInterval(() => {
    if (!state.running) return
    const output = renderFn(state.frame)
    state.frame++
    callback(output)
  }, interval)

  animations.set(id, state)
}

export function stopAnimation(id: string): void {
  const state = animations.get(id)
  if (state?.interval) {
    clearInterval(state.interval)
    state.running = false
    animations.delete(id)
  }
}

export function stopAllAnimations(): void {
  for (const [id] of animations) {
    stopAnimation(id)
  }
}

export function isAnimating(id: string): boolean {
  return animations.get(id)?.running ?? false
}

export namespace Animation {
  export function setReducedMotion(enabled: boolean): void {
    setReducedMotion(enabled)
  }

  export function getReducedMotion(): boolean {
    return getReducedMotion()
  }

  export function shouldAnimate(): boolean {
    return shouldAnimate()
  }

  export function renderPulse(): string {
    return renderPulse()
  }

  export function renderProgressSpinner(): string {
    return renderProgressSpinner()
  }

  export function start(
    id: string,
    renderFn: (frame: number) => string,
    callback: (output: string) => void,
    interval?: number,
  ): void {
    startAnimation(id, renderFn, callback, interval)
  }

  export function stop(id: string): void {
    stopAnimation(id)
  }

  export function stopAll(): void {
    stopAllAnimations()
  }

  export function isRunning(id: string): boolean {
    return isAnimating(id)
  }
}
