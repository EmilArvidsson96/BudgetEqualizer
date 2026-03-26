import { useState, useEffect } from 'react'
import { MonthData, Settings } from '../types'
import { evalExpr, formatKr } from '../utils/math'

interface BufferValues {
  bufferEmil: number
  bufferAnna: number
}

interface BufferBarProps {
  label: string
  prev: number
  next: number
  mal: number
}

function BufferBar({ label, prev, next, mal }: BufferBarProps) {
  const prevPct = mal > 0 ? Math.min(100, Math.max(0, (prev / mal) * 100)) : 0
  const nextPct = mal > 0 ? Math.min(100, Math.max(0, (next / mal) * 100)) : 0
  const diff = next - prev
  const increasing = diff >= 0

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="text-gray-400">{formatKr(prev)}</span>
          {diff !== 0 && (
            <>
              <span className="text-gray-300">→</span>
              <span
                className={
                  increasing ? 'text-green-600 font-medium' : 'text-red-500 font-medium'
                }
              >
                {formatKr(next)}
              </span>
              <span
                className={`text-xs ${increasing ? 'text-green-400' : 'text-red-400'}`}
              >
                ({increasing ? '+' : ''}
                {formatKr(diff)})
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute h-full rounded-full transition-all duration-300 ${
            increasing ? 'bg-blue-200' : 'bg-blue-400'
          }`}
          style={{ width: `${Math.max(prevPct, nextPct)}%` }}
        />
        <div
          className={`absolute h-full rounded-full transition-all duration-300 ${
            increasing ? 'bg-blue-500' : 'bg-blue-200'
          }`}
          style={{ width: `${Math.min(prevPct, nextPct)}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-0.5">
        Mål {formatKr(mal)} · {Math.round((next / mal) * 100)}%
      </p>
    </div>
  )
}

interface Props {
  /** Buffer at the START of this month (before this month's delta) */
  prevBuffer: BufferValues
  /** Buffer at the END of this month (after delta) */
  newBuffer: BufferValues
  settings: Settings
  month: MonthData
  nameEmil: string
  nameAnna: string
  onOverride: (emilOverride: number | null, annaOverride: number | null) => void
}

export function BufferCard({
  prevBuffer,
  newBuffer,
  settings,
  month,
  nameEmil,
  nameAnna,
  onOverride,
}: Props) {
  // Manual mode: user sets the START-of-month value manually
  const isManual =
    month.bufferEmilOverride !== null || month.bufferAnnaOverride !== null

  // Input state mirrors the override (= start value)
  const [emilInput, setEmilInput] = useState(
    String(Math.round(prevBuffer.bufferEmil)),
  )
  const [annaInput, setAnnaInput] = useState(
    String(Math.round(prevBuffer.bufferAnna)),
  )

  // Sync inputs when the calculated start changes (and not in manual mode)
  useEffect(() => {
    if (!isManual) {
      setEmilInput(String(Math.round(prevBuffer.bufferEmil)))
      setAnnaInput(String(Math.round(prevBuffer.bufferAnna)))
    }
  }, [prevBuffer.bufferEmil, prevBuffer.bufferAnna, isManual])

  const toggleManual = () => {
    if (isManual) {
      onOverride(null, null)
    } else {
      // Seed the override with the current calculated start value
      const e = Math.round(prevBuffer.bufferEmil)
      const a = Math.round(prevBuffer.bufferAnna)
      setEmilInput(String(e))
      setAnnaInput(String(a))
      onOverride(e, a)
    }
  }

  const handleEmilChange = (v: string) => {
    setEmilInput(v)
    const n = evalExpr(v)
    if (Number.isFinite(n)) onOverride(n, month.bufferAnnaOverride)
  }

  const handleAnnaChange = (v: string) => {
    setAnnaInput(v)
    const n = evalExpr(v)
    if (Number.isFinite(n)) onOverride(month.bufferEmilOverride, n)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Buffert
        </h2>

        {/* Toggle */}
        <button
          type="button"
          onClick={toggleManual}
          className="flex items-center gap-2 group"
        >
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            Manuellt ingångsvärde
          </span>
          <div
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
              isManual ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                isManual ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Manual start-value inputs */}
      {isManual && (
        <div className="grid grid-cols-2 gap-3 pb-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Ingångsvärde {nameEmil}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={emilInput}
                onChange={(e) => handleEmilChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm border border-blue-200 rounded-lg
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-blue-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
                kr
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Ingångsvärde {nameAnna}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={annaInput}
                onChange={(e) => handleAnnaChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm border border-blue-200 rounded-lg
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-blue-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
                kr
              </span>
            </div>
          </div>
        </div>
      )}

      <BufferBar
        label={nameEmil}
        prev={prevBuffer.bufferEmil}
        next={newBuffer.bufferEmil}
        mal={settings.bufferMalEmil}
      />
      <BufferBar
        label={nameAnna}
        prev={prevBuffer.bufferAnna}
        next={newBuffer.bufferAnna}
        mal={settings.bufferMalAnna}
      />
    </div>
  )
}
