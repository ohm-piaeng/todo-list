import { memo, useCallback } from 'react'
import { TEXT_SIZES } from '@shared/notebook/constants'
import type { TextWeight } from '@shared/notebook'
import { Divider } from '@renderer/shared/ui/atoms'
import { SegmentedControl, Select, Toolbar } from '@renderer/shared/ui/molecules'
import { useUpdateTextStyle } from '../api/todo.queries'

const SIZE_OPTIONS = TEXT_SIZES.map((s) => ({ value: String(s), label: `${s} px` }))

const WEIGHTS: { value: TextWeight; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' }
]

export interface ITodoToolbarProps {
  documentId: number
  textSize: number
  textWeight: TextWeight
}

/** Text size + weight for every task in the list (design: Toolbar/Todo). */
export const TodoToolbar = memo(function TodoToolbar({
  documentId,
  textSize,
  textWeight
}: ITodoToolbarProps) {
  const { mutate } = useUpdateTextStyle(documentId)
  const setWeight = useCallback((w: TextWeight) => mutate({ textWeight: w }), [mutate])

  return (
    <Toolbar label="Text style" className="gap-2 pr-1.5">
      <Select
        icon="textSize"
        aria-label="Text size"
        options={SIZE_OPTIONS}
        value={String(textSize)}
        onChange={(e) => mutate({ textSize: Number(e.target.value) })}
      />
      <Divider orientation="vertical" className="mx-0" />
      <SegmentedControl
        label="Text weight"
        value={textWeight}
        segments={WEIGHTS}
        onChange={setWeight}
      />
    </Toolbar>
  )
})
