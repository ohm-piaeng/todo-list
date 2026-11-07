import { memo, type SVGProps } from 'react'

interface IGlyph {
  /** Offset of the glyph inside the 16×16 frame (from the design export). */
  t: readonly [number, number]
  d: string
  /** Stroke width; dot-style glyphs (grip, more, list) use 1.5. */
  w?: number
}

/** Icons exported from design/design-system.figcraft (Components page, 16×16 frames). */
const GLYPHS = {
  search: {
    t: [2, 2],
    d: 'M9.5 9.5L12 12M5.5 0C8.538 0 11 2.462 11 5.5C11 8.538 8.538 11 5.5 11C2.462 11 0 8.538 0 5.5C0 2.462 2.462 0 5.5 0Z'
  },
  plus: { t: [3, 3], d: 'M5 0L5 10M0 5L10 5' },
  note: {
    t: [3.5, 1.5],
    d: 'M5.5 0L5.5 3L8.5 3M2.5 6.75L6 6.75M2.5 9.25L6 9.25M0.75 0L5.5 0L8.5 3L8.5 12.5L0.75 12.5C0.25 12.5 0 12.25 0 11.75L0 0.75C0 0.25 0.25 0 0.75 0Z'
  },
  todo: {
    t: [2, 2],
    d: 'M3.25 6L5 7.75L8.25 4M1.75 0L9.75 0C10.917 0 11.5 0.583 11.5 1.75L11.5 9.75C11.5 10.917 10.917 11.5 9.75 11.5L1.75 11.5C0.583 11.5 0 10.917 0 9.75L0 1.75C0 0.583 0.583 0 1.75 0Z'
  },
  heading: { t: [3.5, 3], d: 'M0 0L0 10M8 0L8 10M0 5L8 5' },
  bold: {
    t: [4.5, 2.5],
    d: 'M0 0L4.5 0C6.5 0 7.5 0.917 7.5 2.75C7.5 4.583 6.5 5.5 4.5 5.5L0 5.5L0 0ZM0 5.5L5.5 5.5C7.5 5.5 8.5 6.417 8.5 8.25C8.5 10.083 7.5 11 5.5 11L0 11L0 5.5Z'
  },
  italic: { t: [4, 2.5], d: 'M3 0L8 0M0 11L5 11M5.5 0L2.5 11' },
  strike: {
    t: [3, 2.5],
    d: 'M0 5.5L10 5.5M8 2C7.333 0.667 6.333 0 5 0C3 0 2 0.833 2 2.5M2 9C2.667 10.333 3.667 11 5 11C7 11 8 10.167 8 8.5'
  },
  list: {
    t: [2.5, 4],
    d: 'M3.5 0L11.5 0M3.5 4L11.5 4M3.5 8L11.5 8M0 0L0.1 0M0 4L0.1 4M0 8L0.1 8',
    w: 1.5
  },
  quote: { t: [3, 3.5], d: 'M0 0L0 9M3 1.5L10 1.5M3 4.5L10 4.5M3 7.5L8 7.5' },
  code: { t: [2, 4.5], d: 'M3.5 0L0 3.5L3.5 7M8.5 0L12 3.5L8.5 7' },
  link: {
    t: [2.75, 2.75],
    d: 'M4.25 6.25C5.25 7.25 6.25 7.25 7.25 6.25L9.75 3.75C10.75 2.75 10.75 1.75 9.75 0.75C8.75 -0.25 7.75 -0.25 6.75 0.75L5.75 1.75M6.25 4.25C5.25 3.25 4.25 3.25 3.25 4.25L0.75 6.75C-0.25 7.75 -0.25 8.75 0.75 9.75C1.75 10.75 2.75 10.75 3.75 9.75L4.75 8.75'
  },
  more: { t: [3, 8], d: 'M0 0L0.1 0M5 0L5.1 0M10 0L10.1 0', w: 1.5 },
  trash: {
    t: [2.5, 2.5],
    d: 'M0 1.5L11 1.5M3.5 1.5L3.5 0L7.5 0L7.5 1.5M1.5 1.5L2.2 11L8.8 11L9.5 1.5'
  },
  grip: { t: [6, 4], d: 'M0 0L0.1 0M4 0L4.1 0M0 4L0.1 4M4 4L4.1 4M0 8L0.1 8M4 8L4.1 8', w: 1.5 },
  chevronDown: { t: [4, 6], d: 'M0 0L4 4L8 0' },
  textSize: { t: [1.5, 4], d: 'M0 9L3.5 0L7 9M1.2 6L5.8 6M8 9L10.5 3L13 9M8.8 7L12.2 7' },
  check: { t: [3, 4], d: 'M0 4L3 7L10 0', w: 2 },
  arrowRight: { t: [3, 4], d: 'M0 4L10 4M6.5 0.5L10 4L6.5 7.5' }
} as const satisfies Record<string, IGlyph>

export type IconName = keyof typeof GLYPHS

export interface IIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
}

/** Stroke icon that inherits `currentColor`. Size via className (default 16px). */
export const Icon = memo(function Icon({ name, className, ...props }: IIconProps) {
  const glyph: IGlyph = GLYPHS[name]
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={glyph.w ?? 1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? 'size-4 shrink-0'}
      {...props}
    >
      <path transform={`translate(${glyph.t[0]} ${glyph.t[1]})`} d={glyph.d} />
    </svg>
  )
})
