import { describe, it, expect } from "bun:test"
import { BOX_CHARS, createBox, createBoxWithTitle, createPanel } from "./box"

describe("BOX_CHARS", () => {
  it("should have rounded style", () => {
    expect(BOX_CHARS.rounded).toBeDefined()
    expect(BOX_CHARS.rounded.topLeft).toBe("╭")
    expect(BOX_CHARS.rounded.topRight).toBe("╮")
    expect(BOX_CHARS.rounded.bottomLeft).toBe("╰")
    expect(BOX_CHARS.rounded.bottomRight).toBe("╯")
    expect(BOX_CHARS.rounded.horizontal).toBe("─")
    expect(BOX_CHARS.rounded.vertical).toBe("│")
  })

  it("should have solid style", () => {
    expect(BOX_CHARS.solid).toBeDefined()
    expect(BOX_CHARS.solid.topLeft).toBe("┌")
    expect(BOX_CHARS.solid.topRight).toBe("┐")
    expect(BOX_CHARS.solid.bottomLeft).toBe("└")
    expect(BOX_CHARS.solid.bottomRight).toBe("┘")
  })

  it("should have double style", () => {
    expect(BOX_CHARS.double).toBeDefined()
    expect(BOX_CHARS.double.topLeft).toBe("╔")
    expect(BOX_CHARS.double.horizontal).toBe("═")
    expect(BOX_CHARS.double.vertical).toBe("║")
  })

  it("should have bold style", () => {
    expect(BOX_CHARS.bold).toBeDefined()
    expect(BOX_CHARS.bold.topLeft).toBe("┏")
    expect(BOX_CHARS.bold.horizontal).toBe("━")
    expect(BOX_CHARS.bold.vertical).toBe("┃")
  })
})

describe("createBox", () => {
  it("should create a simple box", () => {
    const lines = createBox(["Hello", "World"])
    expect(lines.length).toBe(4)
    expect(lines[0]).toContain("╭")
    expect(lines[0]).toContain("╮")
    expect(lines[lines.length - 1]).toContain("╰")
    expect(lines[lines.length - 1]).toContain("╯")
  })

  it("should create box with custom width", () => {
    const lines = createBox(["Test"], { width: 20 })
    expect(lines[0].length).toBe(20)
  })

  it("should create box with padding", () => {
    const lines = createBox(["Test"], { padding: 2 })
    expect(lines.length).toBe(3)
    expect(lines[1]).toContain("Test")
  })

  it("should use solid style", () => {
    const lines = createBox(["Test"], { style: "solid" })
    expect(lines[0]).toContain("┌")
    expect(lines[0]).toContain("┐")
  })

  it("should use double style", () => {
    const lines = createBox(["Test"], { style: "double" })
    expect(lines[0]).toContain("╔")
    expect(lines[0]).toContain("╗")
  })

  it("should use bold style", () => {
    const lines = createBox(["Test"], { style: "bold" })
    expect(lines[0]).toContain("┏")
    expect(lines[0]).toContain("┓")
  })
})

describe("createBoxWithTitle", () => {
  it("should create box with title", () => {
    const lines = createBoxWithTitle(["Content"], "Title")
    expect(lines[0]).toContain("Title")
    expect(lines.length).toBeGreaterThan(2)
  })

  it("should calculate width based on title", () => {
    const lines = createBoxWithTitle(["Hi"], "VeryLongTitle")
    expect(lines[0].length).toBeGreaterThanOrEqual("VeryLongTitle".length)
  })
})

describe("createPanel", () => {
  it("should create panel with title", () => {
    const lines = createPanel("Panel", ["Line1", "Line2"])
    expect(lines[0]).toContain("Panel")
    expect(lines.length).toBe(4)
  })

  it("should use solid style by default", () => {
    const lines = createPanel("Test", ["Content"])
    expect(lines[0]).toContain("┌")
  })
})
