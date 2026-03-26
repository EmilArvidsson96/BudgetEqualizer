import { formatKr } from '../utils/math'

interface Props {
  emilKvar: number
  annaKvar: number
  nameEmil: string
  nameAnna: string
}

export function ResultCard({ emilKvar, annaKvar, nameEmil, nameAnna }: Props) {
  const hasInput = emilKvar !== 0 || annaKvar !== 0
  const eq = (annaKvar - emilKvar) / 2
  const attRoraSig = (emilKvar + annaKvar) / 2
  const payer = eq >= 0 ? nameAnna : nameEmil
  const receiver = eq >= 0 ? nameEmil : nameAnna

  if (!hasInput) {
    return (
      <div className="bg-gray-100 rounded-2xl p-5 flex items-center justify-center h-24">
        <p className="text-sm text-gray-400">Fyll i lön och ska dras</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-600 rounded-2xl p-5 text-white">
      {/* Hero: swish amount */}
      <div className="mb-4">
        <p className="text-sm opacity-70 mb-0.5">
          {payer} swishar {receiver}
        </p>
        <p className="text-4xl font-bold tracking-tight">
          {formatKr(Math.abs(eq))}
        </p>
      </div>

      {/* Spending money */}
      <div className="border-t border-blue-500 pt-4 flex justify-between items-baseline">
        <p className="text-sm opacity-75">Att röra sig med vardera</p>
        <p className="text-xl font-semibold">{formatKr(attRoraSig)}</p>
      </div>

      {/* Kvar breakdown */}
      <div className="mt-3 pt-3 border-t border-blue-500 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs opacity-50 mb-0.5">{nameEmil} kvar</p>
          <p className="text-sm font-medium">{formatKr(emilKvar)}</p>
        </div>
        <div>
          <p className="text-xs opacity-50 mb-0.5">{nameAnna} kvar</p>
          <p className="text-sm font-medium">{formatKr(annaKvar)}</p>
        </div>
      </div>
    </div>
  )
}
