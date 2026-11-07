import type { ButtonHTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'
import { tv } from '@renderer/shared/lib'

const buttonStyles = tv({
  base: 'inline-flex items-center justify-center gap-1.5 rounded-md text-body font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-brand text-fg-on-accent hover:bg-brand-deep',
      ghost: 'text-fg-secondary hover:bg-subtle hover:text-fg',
      danger: 'text-fg-tertiary hover:bg-danger-bg hover:text-danger-fg'
    },
    size: {
      sm: 'h-control-sm px-2',
      md: 'h-control-md px-3',
      icon: 'size-control-sm'
    }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
})

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: IButtonProps): React.JSX.Element {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />
}
