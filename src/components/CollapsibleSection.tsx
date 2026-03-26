import { useState, ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  badge?: string
  badgeColor?: string  // Tailwind text-color class, e.g. 'text-green-500'
  children: ReactNode
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  badgeColor = 'text-blue-400',
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-left"
      >
        <span
          className={`inline-block transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ›
        </span>
        <span>{title}</span>
        {badge && !open && (
          <span className={`ml-auto font-medium ${badgeColor}`}>{badge}</span>
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-3 border-l-2 border-gray-100 mt-2 space-y-2.5">
          {children}
        </div>
      </div>
    </div>
  )
}
