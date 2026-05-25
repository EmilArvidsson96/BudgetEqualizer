import { Settings, ZlantarAgreement, ZlantarBank, ZlantarSnapshot } from '../types'

export interface ZlantarPayload {
  user: {
    first_name?: string
    last_name?: string
    email?: string
  }
  banks: ZlantarBank[]
  agreements?: ZlantarAgreement[]
}

export function isZlantarPayload(x: unknown): x is ZlantarPayload {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const user = o.user as Record<string, unknown> | undefined
  return !!user && typeof user.first_name === 'string' && Array.isArray(o.banks)
}

export function snapshotFromZlantar(payload: ZlantarPayload): ZlantarSnapshot {
  return {
    firstName: payload.user.first_name ?? '',
    lastName: payload.user.last_name ?? '',
    email: payload.user.email ?? '',
    banks: payload.banks ?? [],
    agreements: payload.agreements ?? [],
    importedAt: new Date().toISOString(),
  }
}

export function matchPerson(
  payload: ZlantarPayload,
  settings: Settings,
): 'emil' | 'anna' | null {
  const firstWord = (payload.user.first_name ?? '').trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  if (!firstWord) return null
  const emil = settings.nameEmil.trim().toLowerCase()
  const anna = settings.nameAnna.trim().toLowerCase()
  const matchesEmil = !!emil && firstWord === emil
  const matchesAnna = !!anna && firstWord === anna
  if (matchesEmil && !matchesAnna) return 'emil'
  if (matchesAnna && !matchesEmil) return 'anna'
  return null
}

const BANK_NAMES: Record<string, string> = {
  lansforsakringar: 'Länsförsäkringar',
  swedbank: 'Swedbank',
  handelsbanken: 'Handelsbanken',
  seb: 'SEB',
  nordea: 'Nordea',
  ica: 'ICA Banken',
  danskebank: 'Danske Bank',
  sbab: 'SBAB',
  avanza: 'Avanza',
  nordnet: 'Nordnet',
}

export function prettyBankName(name: string): string {
  const key = name.toLowerCase().replace(/[\s-]/g, '')
  return BANK_NAMES[key] ?? (name.charAt(0).toUpperCase() + name.slice(1))
}

export function translateAccountType(type: string): string {
  switch (type) {
    case 'Loan': return 'Lån'
    case 'Transactional': return 'Transaktionskonto'
    case 'Savings': return 'Sparkonto'
    default: return type
  }
}

/** Account numbers that appear in both snapshots. */
export function sharedAccountNumbers(
  a: ZlantarSnapshot | null,
  b: ZlantarSnapshot | null,
): Set<string> {
  if (!a || !b) return new Set()
  const numbersA = new Set(a.banks.flatMap((bank) => bank.accounts.map((acc) => acc.account_number)))
  const result = new Set<string>()
  for (const bank of b.banks) {
    for (const acc of bank.accounts) {
      if (numbersA.has(acc.account_number)) result.add(acc.account_number)
    }
  }
  return result
}
