export namespace Spacing {
  export const space1 = "0.25rem"
  export const space2 = "0.5rem"
  export const space3 = "0.75rem"
  export const space4 = "1rem"
  export const space5 = "1.25rem"
  export const space6 = "1.5rem"
  export const space8 = "2rem"
  export const space10 = "2.5rem"
  export const space12 = "3rem"

  export type Space = "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12"

  const spaceMap: Record<Space, string> = {
    "1": space1,
    "2": space2,
    "3": space3,
    "4": space4,
    "5": space5,
    "6": space6,
    "8": space8,
    "10": space10,
    "12": space12,
  }

  export function get(name: Space): string {
    return spaceMap[name]
  }

  export function px(name: Space): number {
    return parseFloat(spaceMap[name]) * 16
  }
}

export namespace Radius {
  export const radiusSm = "4px"
  export const radiusMd = "8px"
  export const radiusLg = "12px"
  export const radiusXl = "16px"
  export const radius2xl = "24px"
  export const radiusFull = "9999px"

  export type Radius = "sm" | "md" | "lg" | "xl" | "2xl" | "full"

  const radiusMap: Record<Radius, string> = {
    sm: radiusSm,
    md: radiusMd,
    lg: radiusLg,
    xl: radiusXl,
    "2xl": radius2xl,
    full: radiusFull,
  }

  export function get(name: Radius): string {
    return radiusMap[name]
  }
}
