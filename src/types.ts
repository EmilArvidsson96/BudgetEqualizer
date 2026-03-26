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

export interface StoredData {
  months: Record<string, MonthData>
  settings: Settings
  instructions: string[]
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
