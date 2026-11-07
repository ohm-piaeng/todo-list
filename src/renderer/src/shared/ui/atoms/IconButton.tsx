import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { tv } from '@renderer/shared/lib'
import { Icon, type IconName } from './Icon'

const iconButton = tv({
  base: 'inline-flex shrink-0 items-center justify-center text-fg-secondary transition-colors outline-none hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-40 aria-expanded:bg-subtle aria-pressed:bg-subtle aria-pressed:text-fg',
  variants: {
    size: {
      sm: 'size-6 rounded-sm',
      md: 'size-7 rounded-sm'
    }
  },
  defaultVariants: { size: 'md' }
})

export interface IIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Accessible name (icon-only button). */
  label: string
  size?: 'sm' | 'md'
}

/** Square icon-only button (design: IconButton / ToolbarButton, 28px, radius 5). */
export const IconButton = forwardRef<HTMLButtonElement, IIconButtonProps>(function IconButton(
  { icon, label, size, className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={iconButton({ size, className })}
      {...props}
    >
      <Icon name={icon} />
    </button>
  )
})
