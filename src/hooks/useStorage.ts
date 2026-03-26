import { useState, useRef, useCallback, useEffect } from 'react'
import { StoredData, MonthData, PersonData, Settings, DEFAULT_MONTH } from '../types'

export function useStorage(
  initialData: StoredData,
  onSave: (data: StoredData) => void,
  saveDelay = 300,
) {
  const [data, setDataRaw] = useState(initialData)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // Always call the latest onSave without making it a dep of setData
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave })

  const setData = useCallback(
    (updater: (prev: StoredData) => StoredData) => {
      setDataRaw((prev) => {
        const next = updater(prev)
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => onSaveRef.current(next), saveDelay)
        return next
      })
    },
    [saveDelay],
  )

  const setPersonData = useCallback(
    (monthKey: string, person: 'emil' | 'anna', p: PersonData) => {
      setData((prev) => ({
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: { ...(prev.months[monthKey] ?? DEFAULT_MONTH), [person]: p },
        },
      }))
    },
    [setData],
  )

  const setBufferOverride = useCallback(
    (monthKey: string, emilOverride: number | null, annaOverride: number | null) => {
      setData((prev) => ({
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...(prev.months[monthKey] ?? DEFAULT_MONTH),
            bufferEmilOverride: emilOverride,
            bufferAnnaOverride: annaOverride,
          },
        },
      }))
    },
    [setData],
  )

  const setSettings = useCallback(
    (s: Settings) => setData((prev) => ({ ...prev, settings: s })),
    [setData],
  )

  const setInstructions = useCallback(
    (instructions: string[]) => setData((prev) => ({ ...prev, instructions })),
    [setData],
  )

  /** Replace all data immediately (used when switching datasets). */
  const replaceData = useCallback((newData: StoredData) => {
    clearTimeout(saveTimer.current)
    setDataRaw(newData)
  }, [])

  return { data, setPersonData, setBufferOverride, setSettings, setInstructions, replaceData }
}
