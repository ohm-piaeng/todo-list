import type { InputHTMLAttributes } from 'react'
import { cn } from '@renderer/shared/lib'
import { Icon } from '@renderer/shared/ui/atoms'

export interface ISearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export function SearchField({ className, ...props }: ISearchFieldProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'flex h-7 items-center gap-2 rounded-md bg-subtle px-3 text-fg-secondary focus-within:ring-2 focus-within:ring-brand',
        className
      )}
    >
      <Icon name="search" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
    </label>
  )
}
