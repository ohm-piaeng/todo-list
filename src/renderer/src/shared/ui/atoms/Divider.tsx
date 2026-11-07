import { cn } from '@renderer/shared/lib'

export interface IDividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({
  orientation = 'horizontal',
  className
}: IDividerProps): React.JSX.Element {
  return (
    <span
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'vertical' ? 'mx-1 h-4 w-px' : 'h-px w-full',
        className
      )}
    />
  )
}
