import { formatKr } from '../utils/math'

interface Props {
  totalInkomst: number
  totalSpar: number
  fakturakons: number
  egenkonsumtion: number
  netto: number
  attRoraSig: number
  // kept for potential future detail, not used in waterfall
  totalSparBuffert?: number
  totalSparResa?: number
  totalSparPension?: number
  totalSparKapital?: number
}

interface WFRow {
  label: string
  shortLabel: string
  value: number
  leftPct: number
  widthPct: number
  color: string
  isResult?: boolean
}

function buildRows(
  totalInkomst: number,
  totalSpar: number,
  fakturakons: number,
  egenkonsumtion: number,
): WFRow[] {
  if (totalInkomst === 0 && totalSpar === 0 && fakturakons === 0 && egenkonsumtion === 0)
    return []

  const totalOut = totalSpar + fakturakons + egenkonsumtion
  const chartMax = Math.max(totalInkomst, totalOut) || 1
  const toPct = (v: number) => Math.max(0, Math.min(100, (v / chartMax) * 100))

  const rows: WFRow[] = []
  let remaining = totalInkomst

  rows.push({
    label: 'Inkomst',
    shortLabel: 'Inkomst',
    value: totalInkomst,
    leftPct: 0,
    widthPct: toPct(totalInkomst),
    color: '#3b82f6',
  })

  if (totalSpar > 0) {
    remaining -= totalSpar
    rows.push({
      label: 'Sparande',
      shortLabel: 'Sparande',
      value: -totalSpar,
      leftPct: toPct(Math.max(0, remaining)),
      widthPct: toPct(totalSpar),
      color: '#22c55e',
    })
  }

  if (fakturakons > 0) {
    remaining -= fakturakons
    rows.push({
      label: 'Fakturakonsumtion',
      shortLabel: 'Faktura',
      value: -fakturakons,
      leftPct: toPct(Math.max(0, remaining)),
      widthPct: toPct(fakturakons),
      color: '#f97316',
    })
  }

  if (egenkonsumtion > 0) {
    remaining -= egenkonsumtion
    rows.push({
      label: 'Egenkonsumtion',
      shortLabel: 'Eget',
      value: -egenkonsumtion,
      leftPct: toPct(Math.max(0, remaining)),
      widthPct: toPct(egenkonsumtion),
      color: '#ef4444',
    })
  }

  const netto = remaining
  rows.push({
    label: netto >= 0 ? 'Netto' : 'Underskott',
    shortLabel: netto >= 0 ? 'Netto' : 'Underskott',
    value: netto,
    leftPct: 0,
    widthPct: toPct(Math.abs(netto)),
    color: netto >= 0 ? '#10b981' : '#ef4444',
    isResult: true,
  })

  return rows
}

function Stat({
  label,
  value,
  valueClass = 'text-gray-800',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function ConsumptionChart({
  totalInkomst,
  totalSpar,
  fakturakons,
  egenkonsumtion,
  netto,
  attRoraSig,
}: Props) {
  const rows = buildRows(totalInkomst, totalSpar, fakturakons, egenkonsumtion)

  if (rows.length === 0) return null

  const totalKons = fakturakons + egenkonsumtion

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Konsumtionsanalys
      </h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
        <Stat label="Inkomst" value={formatKr(totalInkomst)} />
        <Stat label="Sparande" value={formatKr(totalSpar)} />
        <Stat label="Konsumtion" value={formatKr(totalKons)} />
        <Stat
          label="Netto"
          value={(netto >= 0 ? '+' : '') + formatKr(netto)}
          valueClass={netto >= 0 ? 'text-green-600' : 'text-red-500'}
        />
      </div>

      {/* Waterfall rows */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            {/* Label */}
            <span
              className={`text-xs w-24 text-right flex-shrink-0 ${
                row.isResult
                  ? 'font-semibold text-gray-700'
                  : 'text-gray-400'
              }`}
              title={row.label}
            >
              {row.shortLabel}
            </span>

            {/* Bar track */}
            <div className="flex-1 relative h-7 bg-gray-50 rounded-md overflow-hidden">
              <div
                className="absolute h-full rounded-md transition-all duration-300"
                style={{
                  left: `${row.leftPct}%`,
                  width: `${Math.min(row.widthPct, 100 - row.leftPct)}%`,
                  backgroundColor: row.color,
                  opacity: row.isResult ? 1 : 0.85,
                }}
              />
              {/* Value label inside bar when bar is wide enough */}
              {row.widthPct > 15 && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-white text-xs font-medium px-1.5 pointer-events-none"
                  style={{ left: `calc(${row.leftPct}% + 4px)` }}
                >
                  {formatKr(Math.abs(row.value))}
                </span>
              )}
            </div>

            {/* Value */}
            <span
              className={`text-xs font-medium w-20 text-right flex-shrink-0 ${
                row.value >= 0 ? 'text-gray-700' : 'text-gray-600'
              }`}
            >
              {row.value > 0 ? '+' : ''}
              {formatKr(row.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Disposable note */}
      {attRoraSig !== 0 && (
        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Fritt disponibelt per person denna månad
          </span>
          <span
            className={`text-xs font-semibold ${
              attRoraSig >= 0 ? 'text-blue-600' : 'text-red-500'
            }`}
          >
            {formatKr(attRoraSig)}
          </span>
        </div>
      )}
    </div>
  )
}
