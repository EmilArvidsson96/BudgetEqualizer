import { useState } from 'react'
import { evalExpr, formatKr, isExpression } from '../utils/math'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  inputType?: 'number' | 'text'
  placeholder?: string
}

/** Format a plain number with Swedish thousands spacing (no currency symbol) */
function formatThousands(raw: string): string {
  const n = evalExpr(raw)
  if (!Number.isFinite(n)) return raw
  return new Intl.NumberFormat('sv-SE').format(Math.round(n))
}

export function Field({
  label,
  value,
  onChange,
  hint,
  inputType = 'number',
  placeholder,
}: Props) {
  const [focused, setFocused] = useState(false)

  const isNum = inputType === 'number'
  const isPlain = isNum && value.trim() !== '' && !isExpression(value)
  // Show thousands-formatted number when not focused and it's a plain number
  const showFormatted = !focused && isPlain
  const showEval = isNum && !focused && isExpression(value)

  const displayValue = showFormatted ? formatThousands(value) : value

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode={isNum ? 'decimal' : 'text'}
          value={displayValue}
          onChange={(e) =>
            // Strip spaces so copy-pasted formatted numbers work too
            onChange(e.target.value.replace(/\s/g, ''))
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? (isNum ? '0' : '')}
          className={`w-full pl-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
            transition-colors ${isNum ? 'pr-8' : 'pr-3'}`}
        />
        {isNum && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 select-none pointer-events-none">
            kr
          </span>
        )}
      </div>
      {showEval && (
        <p className="text-xs text-blue-500 mt-0.5">
          = {formatKr(evalExpr(value))}
        </p>
      )}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}
