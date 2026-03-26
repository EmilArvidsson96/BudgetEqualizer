export function evalExpr(raw: string): number {
  if (!raw?.trim()) return 0
  const sanitized = raw
    .replace(/,/g, '.')
    .replace(/[^0-9+\-*/.() ]/g, '')
    .trim()
  if (!sanitized) return 0
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)() as unknown
    if (typeof result !== 'number' || !Number.isFinite(result)) return 0
    return result
  } catch {
    return 0
  }
}

export function formatKr(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(Math.round(n))
}

/** True when the string contains math operators (not just a plain number) */
export function isExpression(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return false
  return /[+\-*/]/.test(trimmed.slice(1)) // skip leading minus
}
