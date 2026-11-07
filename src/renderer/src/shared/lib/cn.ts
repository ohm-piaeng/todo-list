import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { createTV } from 'tailwind-variants'

/**
 * tailwind-merge must know the custom token names from styles/theme.css,
 * otherwise it treats e.g. `text-body` (font size) and `text-fg` (color) as the
 * same group and drops one. Keep in sync when adding a token to @theme.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'window',
        'sidebar',
        'row-alt',
        'subtle',
        'selected',
        'canvas',
        'sidebar-selected',
        'border',
        'border-strong',
        'fg',
        'fg-secondary',
        'fg-tertiary',
        'fg-on-accent',
        'brand',
        'brand-deep',
        'brand-soft',
        'icon-repo',
        'success',
        'success-bg',
        'success-fg',
        'danger',
        'danger-bg',
        'danger-fg',
        'info',
        'info-bg',
        'info-fg',
        'warning',
        'traffic-close',
        'traffic-minimize',
        'traffic-zoom'
      ],
      text: [
        'display-hero',
        'display-welcome',
        'heading-page',
        'heading-card',
        'title-window',
        'body',
        'body-sm',
        'label',
        'caption',
        'badge',
        'mono'
      ],
      radius: ['xs', 'sm', 'md', 'lg', 'xl', 'pill'],
      spacing: ['control-sm', 'control-md', 'row', 'sidebar']
    }
  }
})

/** Merge class names; later Tailwind classes win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** `tv` (tailwind-variants) wired to the same token-aware merger. Use this, not the package export. */
export const tv = createTV({ twMerge })
