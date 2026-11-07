import { memo } from 'react'
import { Icon, type IconName } from '@renderer/shared/ui/atoms'
import { tv } from '@renderer/shared/lib'

const choice = tv({
  slots: {
    root: 'group flex w-75 flex-col items-start gap-4 rounded-xl border border-border bg-window p-7 text-left shadow-card transition-shadow outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60',
    tile: 'flex size-12 items-center justify-center rounded-lg',
    action: 'inline-flex items-center gap-1 text-body font-semibold'
  },
  variants: {
    tone: {
      info: { tile: 'bg-info-bg text-info-fg', action: 'text-info-fg' },
      success: { tile: 'bg-success-bg text-success-fg', action: 'text-success-fg' }
    }
  }
})

export interface IChoiceCardProps {
  icon: IconName
  tone: 'info' | 'success'
  title: string
  description: string
  action: string
  disabled?: boolean
  onSelect: () => void
}

export const ChoiceCard = memo(function ChoiceCard({
  icon,
  tone,
  title,
  description,
  action,
  disabled,
  onSelect
}: IChoiceCardProps) {
  const s = choice({ tone })
  return (
    <button type="button" className={s.root()} disabled={disabled} onClick={onSelect}>
      <span className={s.tile()}>
        <Icon name={icon} className="size-6" />
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-heading-card text-fg">{title}</span>
        <span className="text-body text-fg-secondary">{description}</span>
      </span>
      <span className={s.action()}>
        {action}
        <Icon
          name="arrowRight"
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </button>
  )
})
