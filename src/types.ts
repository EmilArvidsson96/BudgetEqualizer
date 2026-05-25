export interface PersonData {
  lon: string
  ovrigInkomst: string
  ovrigInkomstKommentar: string
  skaDras: string
  sparBuffert: string
  sparResa: string
  sparPension: string
  sparKapital: string
  lanatFranBuffert: string
  kvarPaDispenser: string
}

export interface MonthData {
  emil: PersonData
  anna: PersonData
  bufferEmilOverride: number | null
  bufferAnnaOverride: number | null
}

export interface Settings {
  nameEmil: string
  nameAnna: string
  bufferMalEmil: number
  bufferMalAnna: number
  initialBufferEmil: number
  initialBufferAnna: number
}

export interface ZlantarAccount {
  name: string
  account_number: string
  balance: number
  type: string
  account_index: number
}

export interface ZlantarBank {
  name: string
  accounts: ZlantarAccount[]
}

export interface ZlantarAgreement {
  agreement_type: string
  agreement_subtype: string
  amount: number
  frequency: string
  companies: string[]
}

export interface ZlantarSnapshot {
  firstName: string
  lastName: string
  email: string
  banks: ZlantarBank[]
  agreements: ZlantarAgreement[]
  importedAt: string
}

export interface ZlantarData {
  emil: ZlantarSnapshot | null
  anna: ZlantarSnapshot | null
}

export interface StoredData {
  months: Record<string, MonthData>
  settings: Settings
  instructions: string[]
  zlantar: ZlantarData
}

export const DEFAULT_INSTRUCTIONS: string[] = [
  'Lägg in alla swishförfrågningar och se till att månaden är kvitt',
  'Lägg in alla fakturor och kostnader under "Ska dras"',
  'Fyll i sparande (buffert, resa, pension, kapital) under respektive person',
  'Fyll i lånat från buffert och kvar på dispenser om det förekommer',
  'Kontrollera utjämningsresultatet och swisha beloppet',
  'Återför eventuella pengar till buffert',
]

export const DEFAULT_PERSON: PersonData = {
  lon: '',
  ovrigInkomst: '',
  ovrigInkomstKommentar: '',
  skaDras: '',
  sparBuffert: '',
  sparResa: '',
  sparPension: '',
  sparKapital: '',
  lanatFranBuffert: '',
  kvarPaDispenser: '',
}

export const DEFAULT_MONTH: MonthData = {
  emil: { ...DEFAULT_PERSON },
  anna: { ...DEFAULT_PERSON },
  bufferEmilOverride: null,
  bufferAnnaOverride: null,
}

export const DEFAULT_SETTINGS: Settings = {
  nameEmil: 'Emil',
  nameAnna: 'Anna',
  bufferMalEmil: 84000,
  bufferMalAnna: 55440,
  initialBufferEmil: 0,
  initialBufferAnna: 0,
}

export const DEFAULT_ZLANTAR: ZlantarData = {
  emil: null,
  anna: null,
}
