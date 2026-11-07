import { tv } from '@renderer/shared/lib'
import { Icon } from './Icon'

const appMark = tv({
  base: 'inline-flex shrink-0 items-center justify-center bg-linear-135 from-brand-bright to-brand-deep text-fg-on-accent',
  variants: {
    size: {
      sm: 'size-7 rounded-lg',
      lg: 'size-16 rounded-mark shadow-brand'
    }
  },
  defaultVariants: { size: 'sm' }
})

export interface IAppMarkProps {
  size?: 'sm' | 'lg'
  className?: string
}

/** Notebook app icon: brand gradient tile with the note glyph. */
export function AppMark({ size = 'sm', className }: IAppMarkProps): React.JSX.Element {
  return (
    <span className={appMark({ size, className })}>
      <Icon name="note" className={size === 'lg' ? 'size-8' : 'size-4'} />
    </span>
  )
}
