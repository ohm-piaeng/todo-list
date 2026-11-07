import type { InputHTMLAttributes } from 'react'
import { cn } from '@renderer/shared/lib'
import { Icon } from './Icon'

export interface ICheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export function Checkbox({ className, ...props }: ICheckboxProps): React.JSX.Element {
  return (
    <span className={cn('relative inline-flex size-4.5 shrink-0', className)}>
      <input
        type="checkbox"
        className="peer size-full cursor-pointer appearance-none rounded-sm border border-border-strong bg-window transition-colors checked:border-brand checked:bg-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        {...props}
      />
      <Icon
        name="check"
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto size-3 text-fg-on-accent opacity-0 peer-checked:opacity-100"
      />
    </span>
  )
}
