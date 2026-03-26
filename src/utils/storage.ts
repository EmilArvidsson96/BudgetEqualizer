import { StoredData, DEFAULT_SETTINGS, DEFAULT_INSTRUCTIONS } from '../types'

const KEY = 'budget-v2'
const OLD_KEY = 'budget-state'

export function withDefaults(data: Partial<StoredData>): StoredData {
  return {
    months: data.months ?? {},
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    instructions: data.instructions ?? [...DEFAULT_INSTRUCTIONS],
  }
}

export function loadData(): StoredData {
  // Try new format
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return withDefaults(JSON.parse(raw) as Partial<StoredData>)
  } catch {}

  // Try to migrate from old format (budget-state)
  try {
    const raw = localStorage.getItem(OLD_KEY)
    if (raw) {
      const old = JSON.parse(raw) as Record<string, number>
      return withDefaults({
        months: {},
        settings: {
          ...DEFAULT_SETTINGS,
          bufferMalEmil: old.bufferMalEmil ?? DEFAULT_SETTINGS.bufferMalEmil,
          bufferMalAnna: old.bufferMalAnna ?? DEFAULT_SETTINGS.bufferMalAnna,
          initialBufferEmil: old.bufferEmil ?? 0,
          initialBufferAnna: old.bufferAnna ?? 0,
        },
      })
    }
  } catch {}

  return withDefaults({})
}

export function saveData(data: StoredData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}
