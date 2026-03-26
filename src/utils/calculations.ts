import { PersonData, MonthData, StoredData } from '../types'
import { evalExpr } from './math'

export function calcKvar(p: PersonData): number {
  return (
    evalExpr(p.lon) +
    evalExpr(p.ovrigInkomst) -
    evalExpr(p.skaDras)
  )
}

export function calcPersonSpar(p: PersonData) {
  const buffert = evalExpr(p.sparBuffert)
  const resa = evalExpr(p.sparResa)
  const pension = evalExpr(p.sparPension)
  const kapital = evalExpr(p.sparKapital)
  return { buffert, resa, pension, kapital, total: buffert + resa + pension + kapital }
}

/**
 * Estimate how much Emil+Anna actually consumed freely this month:
 * = (borrowed from buffer − returned to buffer) + last month's att röra sig (both people)
 *
 * The buffer draw covers any cash shortfall in invoices.
 * Last month's "att röra sig" is what they had to freely spend—it gets consumed this month.
 */
export function calcEgenkonsumtion(
  month: MonthData,
  prevMonth: MonthData | null,
): number {
  const lanatTotal =
    evalExpr(month.emil.lanatFranBuffert) + evalExpr(month.anna.lanatFranBuffert)
  const kvarTotal =
    evalExpr(month.emil.kvarPaDispenser) + evalExpr(month.anna.kvarPaDispenser)
  const bufferDraw = lanatTotal - kvarTotal

  let prevSpending = 0
  if (prevMonth) {
    const prevEmilKvar = calcKvar(prevMonth.emil)
    const prevAnnaKvar = calcKvar(prevMonth.anna)
    prevSpending = Math.max(0, prevEmilKvar + prevAnnaKvar)
  }

  return Math.max(0, bufferDraw + prevSpending)
}

export function calcConsumptionBreakdown(
  month: MonthData,
  emilKvar: number,
  annaKvar: number,
  egenkonsumtion: number,
) {
  const emilSpar = calcPersonSpar(month.emil)
  const annaSpar = calcPersonSpar(month.anna)

  const totalInkomst =
    evalExpr(month.emil.lon) +
    evalExpr(month.anna.lon) +
    evalExpr(month.emil.ovrigInkomst) +
    evalExpr(month.anna.ovrigInkomst)

  const totalSpar = emilSpar.total + annaSpar.total
  const totalSparBuffert = emilSpar.buffert + annaSpar.buffert
  const totalSparResa = emilSpar.resa + annaSpar.resa
  const totalSparPension = emilSpar.pension + annaSpar.pension
  const totalSparKapital = emilSpar.kapital + annaSpar.kapital

  const totalSkaDras =
    evalExpr(month.emil.skaDras) + evalExpr(month.anna.skaDras)
  const fakturakons = Math.max(0, totalSkaDras - totalSpar)
  const netto = totalInkomst - totalSpar - fakturakons - egenkonsumtion

  // Disposable = what each person gets to freely spend after equalization
  const attRoraSig = (emilKvar + annaKvar) / 2

  return {
    totalInkomst,
    totalSpar,
    totalSparBuffert,
    totalSparResa,
    totalSparPension,
    totalSparKapital,
    fakturakons,
    egenkonsumtion,
    netto,
    attRoraSig,
  }
}

/**
 * Buffer at the END of all months strictly before `monthKey`.
 * Buffer overrides now represent the START value of that month,
 * so the override replaces the inherited value before the delta is applied.
 */
export function prevBufferFor(
  monthKey: string,
  data: StoredData,
): { bufferEmil: number; bufferAnna: number } {
  const sortedKeys = Object.keys(data.months)
    .sort()
    .filter((k) => k < monthKey)

  let emilBuf = data.settings.initialBufferEmil
  let annaBuf = data.settings.initialBufferAnna

  for (const key of sortedKeys) {
    const m = data.months[key]
    // Override = start-of-month value; replaces what was carried forward
    const emilStart =
      m.bufferEmilOverride !== null ? m.bufferEmilOverride : emilBuf
    const annaStart =
      m.bufferAnnaOverride !== null ? m.bufferAnnaOverride : annaBuf
    // End of month = start + this month's delta
    emilBuf =
      emilStart +
      evalExpr(m.emil.sparBuffert) +
      evalExpr(m.emil.kvarPaDispenser) -
      evalExpr(m.emil.lanatFranBuffert)
    annaBuf =
      annaStart +
      evalExpr(m.anna.sparBuffert) +
      evalExpr(m.anna.kvarPaDispenser) -
      evalExpr(m.anna.lanatFranBuffert)
  }

  return { bufferEmil: emilBuf, bufferAnna: annaBuf }
}

/**
 * Projected buffer at END of `month` given the balance at its start.
 * Always applies the delta — override semantics are handled upstream.
 */
export function calcNewBuffer(
  month: MonthData,
  prev: { bufferEmil: number; bufferAnna: number },
): { bufferEmil: number; bufferAnna: number } {
  return {
    bufferEmil:
      prev.bufferEmil +
      evalExpr(month.emil.sparBuffert) +
      evalExpr(month.emil.kvarPaDispenser) -
      evalExpr(month.emil.lanatFranBuffert),
    bufferAnna:
      prev.bufferAnna +
      evalExpr(month.anna.sparBuffert) +
      evalExpr(month.anna.kvarPaDispenser) -
      evalExpr(month.anna.lanatFranBuffert),
  }
}
