import { describe, it, expect } from "bun:test"
import * as Text from "./text"

describe("Text", () => {
  describe("style", () => {
    it("should apply bold style", () => {
      const result = Text.style("Hello", "bold")
      expect(result).toContain("\x1b[1m")
      expect(result).toContain("Hello")
      expect(result).toContain("\x1b[0m")
    })

    it("should apply multiple styles", () => {
      const result = Text.style("Hello", "bold", "italic")
      expect(result).toContain("\x1b[1m")
      expect(result).toContain("\x1b[3m")
    })

    it("should apply dim style", () => {
      const result = Text.style("Hello", "dim")
      expect(result).toContain("\x1b[2m")
    })

    it("should apply underline style", () => {
      const result = Text.style("Hello", "underline")
      expect(result).toContain("\x1b[4m")
    })
  })

  describe("highlight", () => {
    it("should apply accent color", () => {
      const result = Text.highlight("Hello")
      expect(result).toContain("\x1b[")
      expect(result).toContain("Hello")
    })
  })

  describe("success", () => {
    it("should apply success color", () => {
      const result = Text.success("Hello")
      expect(result).toContain("\x1b[")
      expect(result).toContain("Hello")
    })
  })

  describe("warning", () => {
    it("should apply warning color", () => {
      const result = Text.warning("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("error", () => {
    it("should apply error color", () => {
      const result = Text.error("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("muted", () => {
    it("should apply muted color", () => {
      const result = Text.muted("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("secondary", () => {
    it("should apply secondary color", () => {
      const result = Text.secondary("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("primary", () => {
    it("should apply primary color", () => {
      const result = Text.primary("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("accent", () => {
    it("should apply accent color", () => {
      const result = Text.accent("Hello")
      expect(result).toContain("\x1b[")
    })
  })

  describe("truncate", () => {
    it("should not truncate short text", () => {
      const result = Text.truncate("Hello", 10)
      expect(result).toBe("Hello")
    })

    it("should truncate long text with suffix", () => {
      const result = Text.truncate("Hello World", 8)
      expect(result).toBe("Hello...")
    })

    it("should use custom suffix", () => {
      const result = Text.truncate("Hello World", 8, "…")
      expect(result).toBe("Hello W…")
    })
  })

  describe("padRight", () => {
    it("should pad text on the right", () => {
      const result = Text.padRight("Hello", 10)
      expect(result).toBe("Hello     ")
    })

    it("should use custom char", () => {
      const result = Text.padRight("Hello", 10, "-")
      expect(result).toBe("Hello-----")
    })
  })

  describe("padLeft", () => {
    it("should pad text on the left", () => {
      const result = Text.padLeft("Hello", 10)
      expect(result).toBe("     Hello")
    })
  })

  describe("center", () => {
    it("should center text", () => {
      const result = Text.center("Hi", 6)
      expect(result).toBe("  Hi  ")
    })

    it("should handle odd width", () => {
      const result = Text.center("Hi", 5)
      expect(result).toBe(" Hi  ")
    })
  })

  describe("wrap", () => {
    it("should not wrap short text", () => {
      const result = Text.wrap("Hello", 20)
      expect(result).toEqual(["Hello"])
    })

    it("should wrap long text", () => {
      const result = Text.wrap("Hello World Test", 10)
      expect(result.length).toBeGreaterThan(1)
    })

    it("should preserve words", () => {
      const result = Text.wrap("Hello World", 20)
      expect(result[0]).toContain("Hello World")
    })
  })

  describe("wrapWithIndent", () => {
    it("should wrap and indent", () => {
      const result = Text.wrapWithIndent("Hello World Test", 20, 2)
      expect(result[0]).toBe("  Hello World Test")
    })

    it("should wrap to multiple lines with indent", () => {
      const result = Text.wrapWithIndent("Hello World Test Long", 15, 2)
      for (const line of result) {
        expect(line.startsWith("  ")).toBe(true)
      }
    })
  })
})
