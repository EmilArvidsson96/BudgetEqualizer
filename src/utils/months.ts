export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('sv-SE', {
    month: 'short',
    year: 'numeric',
  })
}

export function offsetMonthKey(key: string, offset: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Returns sorted union of all saved month keys + the active month */
export function displayedMonths(
  months: Record<string, unknown>,
  activeMonth: string,
): string[] {
  return [...new Set([...Object.keys(months), activeMonth])].sort()
}
