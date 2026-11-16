
import {
  Banknote,
  CalendarDays,
  Coins,
  FileText,
  Grid2X2,
  Landmark,
  MoreHorizontal,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import type { GuideCategoryWithCount } from '../../types/guide'

interface GuideCategoryFilterProps {
  categories: GuideCategoryWithCount[]
  selectedCategory: string
  onSelect: (slug: string) => void
}

const categoryIcons: Record<string, LucideIcon> = {
  'salary-pension': Coins,
  'labor-allowance': CalendarDays,
  tax: FileText,
  'social-insurance': ShieldCheck,
  'government-support': Landmark,
  other: MoreHorizontal,
}

const categoryIconColors: Record<string, string> = {
  'salary-pension': 'text-warning',
  'labor-allowance': 'text-success',
  tax: 'text-danger',
  'social-insurance': 'text-info',
  'government-support': 'text-primary-dark',
  other: 'text-ink-secondary',
}

export default function GuideCategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: GuideCategoryFilterProps) {
  const items = [
    {
      id: 0,
      slug: 'all',
      name: '전체',
      count: categories.reduce(
        (sum, category) => sum + category.count,
        0,
      ),
    },
    ...categories,
  ]

  return (
    <nav aria-label="금융정보 가이드 카테고리">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {items.map((category) => {
          const Icon =
            category.slug === 'all'
              ? Grid2X2
              : categoryIcons[category.slug] ?? Banknote

          const selected = selectedCategory === category.slug

          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelect(category.slug)}
              aria-pressed={selected}
              className={[
                'flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border px-2 py-3 transition-all',
                selected
                  ? 'border-primary bg-primary-50 shadow-soft'
                  : 'border-line bg-surface hover:border-primary-300 hover:bg-primary-50',
              ].join(' ')}
            >
              <Icon
                size={25}
                strokeWidth={1.8}
                className={
                  selected
                    ? 'text-primary-dark'
                    : categoryIconColors[category.slug] ??
                      'text-ink-secondary'
                }
              />

              <span
                className={[
                  'text-center text-xs font-semibold',
                  selected ? 'text-primary-800' : 'text-ink',
                ].join(' ')}
              >
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
