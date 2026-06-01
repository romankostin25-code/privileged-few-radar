'use client'

import { Category } from '@/types'

export type FilterValue = 'all' | Category

interface FilterOption {
  value: FilterValue
  label: string
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All topics' },
  { value: 'wealth', label: 'Wealth & money' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'class', label: 'Class & privilege' },
  { value: 'celebrity', label: 'Celebrity drama' },
  { value: 'culture', label: 'Culture & viral' },
]

interface FilterBarProps {
  active: FilterValue
  onChange: (val: FilterValue) => void
  disabled?: boolean
}

export default function FilterBar({ active, onChange, disabled }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const isActive = active === f.value
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            disabled={disabled}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isActive
                ? 'bg-[rgba(212,165,116,0.18)] border-[#d4a574] text-[#d4a574]'
                : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[#8a8278] hover:border-[rgba(212,165,116,0.4)] hover:text-[#d4a574]',
            ].join(' ')}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
