import type { InputHTMLAttributes } from 'react'
import { cn } from '@renderer/shared/lib'

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: IInputProps): React.JSX.Element {
  return (
    <input
      className={cn(
        'h-control-md w-full bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary',
        className
      )}
      {...props}
    />
  )
}
