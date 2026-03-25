import { describe, it, expect } from "bun:test"
import { Colors, HighContrast } from "./colors"

describe("Colors", () => {
  describe("color values", () => {
    it("should have primary colors", () => {
      expect(Colors.primary).toBe("#0066cc")
      expect(Colors.primaryLight).toBe("#3399ff")
      expect(Colors.primaryDark).toBe("#004080")
    })

    it("should have accent colors", () => {
      expect(Colors.accent).toBe("#00d4ff")
      expect(Colors.accentGlow).toBe("#00d4ff40")
    })

    it("should have status colors", () => {
      expect(Colors.success).toBe("#10b981")
      expect(Colors.warning).toBe("#f59e0b")
      expect(Colors.error).toBe("#ef4444")
    })

    it("should have surface colors", () => {
      expect(Colors.surfaceDark).toBe("#0a1628")
      expect(Colors.surfacePanel).toBe("#0f1f35")
      expect(Colors.surfaceCard).toBe("#142540")
    })

    it("should have text colors", () => {
      expect(Colors.textPrimary).toBe("#ffffff")
      expect(Colors.textSecondary).toBe("#94a3b8")
      expect(Colors.textMuted).toBe("#64748b")
    })
  })

  describe("ansi", () => {
    it("should return ANSI escape code for color", () => {
      const code = Colors.ansi("primary")
      expect(code).toContain("\x1b[")
    })
  })

  describe("rgb", () => {
    it("should return RGB values for color", () => {
      const rgb = Colors.rgb("primary")
      expect(rgb).toEqual({ r: 0, g: 102, b: 204 })
    })
  })

  describe("hex", () => {
    it("should return hex string for color", () => {
      const hex = Colors.hex("primary")
      expect(hex).toBe("#0066cc")
    })
  })

  describe("apply", () => {
    it("should wrap text in ANSI color codes", () => {
      const result = Colors.apply("Hello", "primary")
      expect(result).toContain("\x1b[")
      expect(result).toContain("Hello")
      expect(result).toContain("\x1b[0m")
    })
  })

  describe("ansi256", () => {
    it("should return true color ANSI code", () => {
      const code = Colors.ansi256("primary")
      expect(code).toContain("\x1b[38;2;")
    })
  })

  describe("apply256", () => {
    it("should wrap text in true color ANSI codes", () => {
      const result = Colors.apply256("Hello", "primary")
      expect(result).toContain("\x1b[38;2;")
      expect(result).toContain("Hello")
      expect(result).toContain("\x1b[0m")
    })
  })

  describe("styles", () => {
    it("should have reset code", () => {
      expect(Colors.reset).toBe("\x1b[0m")
    })

    it("should have bold code", () => {
      expect(Colors.bold).toBe("\x1b[1m")
    })

    it("should have dim code", () => {
      expect(Colors.dim).toBe("\x1b[2m")
    })

    it("should have italic code", () => {
      expect(Colors.italic).toBe("\x1b[3m")
    })

    it("should have underline code", () => {
      expect(Colors.underline).toBe("\x1b[4m")
    })
  })
})

describe("HighContrast", () => {
  describe("color values", () => {
    it("should have high contrast colors", () => {
      expect(HighContrast.primary).toBe("#00BBFF")
      expect(HighContrast.success).toBe("#00FF00")
      expect(HighContrast.error).toBe("#FF0000")
      expect(HighContrast.background).toBe("#000000")
    })
  })

  describe("apply", () => {
    it("should wrap text in high contrast ANSI codes", () => {
      const result = HighContrast.apply("Hello", "primary")
      expect(result).toContain("\x1b[")
      expect(result).toContain("Hello")
    })
  })

  describe("ansi", () => {
    it("should return ANSI code for high contrast color", () => {
      const code = HighContrast.ansi("primary")
      expect(code).toContain("\x1b[")
    })
  })
})
