import { useRef, useEffect } from 'react'
import { monthLabel, offsetMonthKey } from '../utils/months'

interface Props {
  months: string[]
  active: string
  onSelect: (key: string) => void
}

export function MonthNav({ months, active, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active tab into view when it changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [active])

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-1 py-2.5">
        <button
          type="button"
          onClick={() => onSelect(offsetMonthKey(active, -1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors text-lg leading-none"
          title="Föregående månad"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto flex-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {months.map((key) => (
            <button
              key={key}
              ref={key === active ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                key === active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {monthLabel(key)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSelect(offsetMonthKey(active, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors text-lg leading-none"
          title="Nästa månad"
        >
          ›
        </button>
      </div>
    </div>
  )
}
