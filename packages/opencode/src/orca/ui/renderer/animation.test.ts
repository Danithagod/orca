import { describe, it, expect, beforeEach } from "bun:test"
import {
  setReducedMotion,
  getReducedMotion,
  shouldAnimate,
  renderPulse,
  resetPulse,
  renderProgressSpinner,
  resetProgressSpinner,
  startAnimation,
  stopAnimation,
  stopAllAnimations,
  isAnimating,
} from "./animation"

describe("Animation", () => {
  beforeEach(() => {
    setReducedMotion(false)
    resetPulse()
    resetProgressSpinner()
    stopAllAnimations()
  })

  describe("reduced motion", () => {
    it("should default to no reduced motion", () => {
      expect(getReducedMotion()).toBe(false)
    })

    it("should set reduced motion", () => {
      setReducedMotion(true)
      expect(getReducedMotion()).toBe(true)
    })

    it("shouldAnimate should return false when reduced motion is enabled", () => {
      setReducedMotion(true)
      expect(shouldAnimate()).toBe(false)
    })

    it("shouldAnimate should return true when reduced motion is disabled", () => {
      setReducedMotion(false)
      expect(shouldAnimate()).toBe(true)
    })
  })

  describe("renderPulse", () => {
    it("should animate when reduced motion is disabled", () => {
      setReducedMotion(false)
      const first = renderPulse()
      const second = renderPulse()
      const third = renderPulse()
      const fourth = renderPulse()
      const fifth = renderPulse()

      expect(first).toBe("○")
      expect(second).toBe("◎")
      expect(third).toBe("●")
      expect(fourth).toBe("◎")
      expect(fifth).toBe("○")
    })

    it("should return static icon when reduced motion is enabled", () => {
      setReducedMotion(true)
      const first = renderPulse()
      const second = renderPulse()
      const third = renderPulse()

      expect(first).toBe("●")
      expect(second).toBe("●")
      expect(third).toBe("●")
    })
  })

  describe("resetPulse", () => {
    it("should reset pulse frame", () => {
      renderPulse()
      renderPulse()
      renderPulse()
      resetPulse()
      const result = renderPulse()
      expect(result).toBe("○")
    })
  })

  describe("renderProgressSpinner", () => {
    it("should animate when reduced motion is disabled", () => {
      setReducedMotion(false)
      const first = renderProgressSpinner()
      const second = renderProgressSpinner()

      expect(first).toBe("⠋")
      expect(second).toBe("⠙")
    })

    it("should return static icon when reduced motion is enabled", () => {
      setReducedMotion(true)
      const first = renderProgressSpinner()
      const second = renderProgressSpinner()

      expect(first).toBe("⠋")
      expect(second).toBe("⠋")
    })
  })

  describe("resetProgressSpinner", () => {
    it("should reset progress spinner frame", () => {
      renderProgressSpinner()
      renderProgressSpinner()
      resetProgressSpinner()
      const result = renderProgressSpinner()
      expect(result).toBe("⠋")
    })
  })

  describe("startAnimation/stopAnimation", () => {
    it("should not start animation when reduced motion is enabled", (done) => {
      setReducedMotion(true)
      let callCount = 0
      const renderFn = (frame: number) => `frame ${frame}`

      startAnimation(
        "test",
        renderFn,
        (output) => {
          callCount++
        },
        10,
      )

      setTimeout(() => {
        expect(callCount).toBe(1)
        done()
      }, 50)
    })

    it("should stop animation", () => {
      setReducedMotion(false)
      startAnimation(
        "test2",
        (f) => `f${f}`,
        () => {},
        100,
      )
      expect(isAnimating("test2")).toBe(true)

      stopAnimation("test2")
      expect(isAnimating("test2")).toBe(false)
    })

    it("should not start duplicate animation", () => {
      setReducedMotion(false)
      startAnimation(
        "dup",
        (f) => `f${f}`,
        () => {},
        100,
      )
      startAnimation(
        "dup",
        (f) => `f${f}`,
        () => {},
        100,
      )

      stopAnimation("dup")
      expect(isAnimating("dup")).toBe(false)
    })
  })

  describe("isAnimating", () => {
    it("should return false for non-existent animation", () => {
      expect(isAnimating("nonexistent")).toBe(false)
    })
  })
})
