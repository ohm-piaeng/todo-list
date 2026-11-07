import type { SelectHTMLAttributes } from 'react'
import { cn } from '@renderer/shared/lib'
import { Icon, type IconName } from '@renderer/shared/ui/atoms'

export interface ISelectOption {
  value: string
  label: string
}

export interface ISelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: ISelectOption[]
  icon?: IconName
}

/**
 * Native <select> styled as the design's Select (icon · value · chevron).
 * Native keeps OS keyboard/a11y behaviour for free.
 */
export function Select({ options, icon, className, ...props }: ISelectProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'relative inline-flex h-7 items-center rounded-md border border-border bg-window text-fg-secondary focus-within:ring-2 focus-within:ring-brand',
        className
      )}
    >
      {icon && <Icon name={icon} className="pointer-events-none absolute left-2.5 size-4" />}
      <select
        className={cn(
          'h-full cursor-pointer appearance-none bg-transparent pr-7 text-body-sm text-fg outline-none',
          icon ? 'pl-8' : 'pl-2.5'
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2 size-4" />
    </span>
  )
}
