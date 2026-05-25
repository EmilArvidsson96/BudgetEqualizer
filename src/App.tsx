import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_MONTH } from './types'
import { useStorage } from './hooks/useStorage'
import { currentMonthKey, displayedMonths } from './utils/months'
import {
  calcKvar,
  calcEgenkonsumtion,
  calcConsumptionBreakdown,
  prevBufferFor,
  calcNewBuffer,
} from './utils/calculations'
import { buildApi, DataApi, DatasetMeta } from './utils/dataApi'
import { isAuthSetup, getLegacyConfig, clearAuth } from './utils/authStore'
import { withDefaults, loadData } from './utils/storage'
import { ZlantarPayload, matchPerson, snapshotFromZlantar } from './utils/zlantar'
import { MonthNav } from './components/MonthNav'
import { PersonCard } from './components/PersonCard'
import { ResultCard } from './components/ResultCard'
import { BufferCard } from './components/BufferCard'
import { ConsumptionChart } from './components/ConsumptionChart'
import { SettingsPanel } from './components/SettingsPanel'
import { InstructionsPanel } from './components/InstructionsPanel'
import { DatasetPanel } from './components/DatasetPanel'
import { GitHubSetup } from './components/GitHubSetup'
import { LockScreen } from './components/LockScreen'
import { SecuritySetup } from './components/SecuritySetup'

const LAST_DATASET_KEY = 'budget-last-dataset'
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)

// ── Auth state machine ────────────────────────────────────────────────────────

type AuthPhase =
  | { phase: 'github-setup' }
  | { phase: 'security-setup'; repo: string; token: string }
  | { phase: 'locked' }
  | { phase: 'unlocked'; repo: string; token: string }

function initialPhase(): AuthPhase {
  if (isLocal) return { phase: 'unlocked', repo: '', token: '' }
  if (isAuthSetup()) return { phase: 'locked' }
  const legacy = getLegacyConfig()
  if (legacy) return { phase: 'security-setup', ...legacy }
  return { phase: 'github-setup' }
}

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState<AuthPhase>(initialPhase)

  if (auth.phase === 'github-setup') {
    return (
      <GitHubSetup
        onConnect={(repo, token) => setAuth({ phase: 'security-setup', repo, token })}
      />
    )
  }

  if (auth.phase === 'security-setup') {
    return (
      <SecuritySetup
        repo={auth.repo}
        token={auth.token}
        onDone={(repo, token) => setAuth({ phase: 'unlocked', repo, token })}
      />
    )
  }

  if (auth.phase === 'locked') {
    return (
      <LockScreen
        onUnlock={(repo, token) => setAuth({ phase: 'unlocked', repo, token })}
      />
    )
  }

  return <BudgetApp repo={auth.repo} token={auth.token} />
}

// ── Budget app (rendered only after auth) ────────────────────────────────────

function BudgetApp({ repo, token }: { repo: string; token: string }) {
  const isGitHub = !!(repo && token)

  const [api] = useState<DataApi>(() => buildApi(repo, token).api)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [datasets, setDatasets] = useState<DatasetMeta[]>([])
  const [currentName, setCurrentName] = useState('')
  const [activeMonth, setActiveMonth] = useState(currentMonthKey)

  const currentNameRef = useRef('')
  useEffect(() => { currentNameRef.current = currentName }, [currentName])

  // GitHub: longer debounce to avoid commit spam; local: snappy 300ms
  const saveDelay = isGitHub ? 5000 : 300

  const handleSave = useCallback(async (d: Parameters<typeof api.saveDataset>[1]) => {
    const name = currentNameRef.current
    if (name) await api.saveDataset(name, d)
  }, [api])

  const { data, setPersonData, setBufferOverride, setSettings, setInstructions, setZlantar, replaceData } =
    useStorage(withDefaults({}), handleSave, saveDelay)

  // Save immediately when page goes to background (critical for mobile)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && currentNameRef.current) {
        api.saveDataset(currentNameRef.current, dataRef.current)
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [api])

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  const initApp = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      let list = await api.listDatasets()

      if (list.length === 0) {
        // First run: migrate localStorage data (if any)
        const legacy = loadData()
        const defaultName =
          legacy.settings.nameEmil && legacy.settings.nameAnna
            ? `${legacy.settings.nameEmil} och ${legacy.settings.nameAnna}`
            : 'Min budget'
        await api.saveDataset(defaultName, legacy)
        list = await api.listDatasets()
        // If listing still returns empty after a successful save, fall back to
        // the name we just wrote so we don't crash on list[0].
        if (list.length === 0) list = [{ name: defaultName, lastModified: 0 }]
      }

      const lastUsed = localStorage.getItem(LAST_DATASET_KEY) ?? ''
      const activeName = list.find((d) => d.name === lastUsed) ? lastUsed : list[0].name

      const loaded = await api.loadDataset(activeName)
      replaceData(withDefaults(loaded ?? {}))
      setCurrentName(activeName)
      setDatasets(list)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Något gick fel vid laddningen.')
    } finally {
      setLoading(false)
    }
  }, [api, replaceData])

  useEffect(() => { initApp() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshDatasets = useCallback(async () => {
    setDatasets(await api.listDatasets())
  }, [api])

  // ── Dataset operations ───────────────────────────────────────────────────────
  const switchDataset = useCallback(async (name: string) => {
    await api.saveDataset(currentNameRef.current, data)
    const loaded = await api.loadDataset(name)
    replaceData(withDefaults(loaded ?? {}))
    setCurrentName(name)
    localStorage.setItem(LAST_DATASET_KEY, name)
    await refreshDatasets()
  }, [api, data, replaceData, refreshDatasets])

  const createDataset = useCallback(async (name: string) => {
    await api.saveDataset(currentNameRef.current, data)
    const empty = withDefaults({})
    await api.saveDataset(name, empty)
    replaceData(empty)
    setCurrentName(name)
    localStorage.setItem(LAST_DATASET_KEY, name)
    await refreshDatasets()
  }, [api, data, replaceData, refreshDatasets])

  const handleDelete = useCallback(async (name: string) => {
    await api.deleteDataset(name)
    const list = await api.listDatasets()
    setDatasets(list)
    if (name === currentNameRef.current && list.length > 0) {
      const loaded = await api.loadDataset(list[0].name)
      replaceData(withDefaults(loaded ?? {}))
      setCurrentName(list[0].name)
      localStorage.setItem(LAST_DATASET_KEY, list[0].name)
    }
  }, [api, replaceData])

  const handleImport = useCallback(async (name: string, importedData: ReturnType<typeof withDefaults>) => {
    await api.saveDataset(name, importedData)
    replaceData(importedData)
    setCurrentName(name)
    localStorage.setItem(LAST_DATASET_KEY, name)
    await refreshDatasets()
  }, [api, replaceData, refreshDatasets])

  const handleZlantarImport = useCallback(async (payload: ZlantarPayload) => {
    const settings = dataRef.current.settings
    let person = matchPerson(payload, settings)
    if (!person) {
      const fullName = `${payload.user.first_name ?? ''} ${payload.user.last_name ?? ''}`.trim()
      const useAnna = window.confirm(
        `Kunde inte automatiskt matcha Zlantar-data för ${fullName || 'denna användare'}.\n\n` +
        `OK = importera till ${settings.nameAnna}\nAvbryt = importera till ${settings.nameEmil}`,
      )
      person = useAnna ? 'anna' : 'emil'
    }
    setZlantar(person, snapshotFromZlantar(payload))
  }, [setZlantar])

  // ── Calculations ─────────────────────────────────────────────────────────────
  const month = data.months[activeMonth] ?? DEFAULT_MONTH
  const months = displayedMonths(data.months, activeMonth)
  const sortedMonths = Object.keys(data.months).sort()
  const prevMonthKey = sortedMonths.filter((k) => k < activeMonth).slice(-1)[0]
  const prevMonthData = prevMonthKey ? data.months[prevMonthKey] : null

  const emilKvar = calcKvar(month.emil)
  const annaKvar = calcKvar(month.anna)
  const egenkonsumtion = calcEgenkonsumtion(month, prevMonthData ?? null)
  const consumption = calcConsumptionBreakdown(month, emilKvar, annaKvar, egenkonsumtion)

  const autoPrevBuffer = prevBufferFor(activeMonth, data)
  const prevBuffer = {
    bufferEmil: month.bufferEmilOverride !== null ? month.bufferEmilOverride : autoPrevBuffer.bufferEmil,
    bufferAnna: month.bufferAnnaOverride !== null ? month.bufferAnnaOverride : autoPrevBuffer.bufferAnna,
  }
  const newBuffer = calcNewBuffer(month, prevBuffer)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Laddar…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 mb-1">Kunde inte ladda data</h1>
            <p className="text-sm text-gray-500">{loadError}</p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={initApp}
              className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
                hover:bg-blue-700 transition-colors"
            >
              Försök igen
            </button>
            {!isLocal && (
              <button
                type="button"
                onClick={() => { clearAuth(); window.location.reload() }}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Återställ inloggning
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MonthNav months={months} active={activeMonth} onSelect={setActiveMonth} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <DatasetPanel
          datasets={datasets}
          currentName={currentName}
          currentData={data}
          onSwitch={switchDataset}
          onCreate={createDataset}
          onDelete={handleDelete}
          onImport={handleImport}
          onZlantarImport={handleZlantarImport}
        />

        <InstructionsPanel instructions={data.instructions} onChange={setInstructions} />

        <div className="grid grid-cols-2 gap-3">
          <PersonCard
            name={data.settings.nameEmil}
            data={month.emil}
            zlantar={data.zlantar.emil}
            onChange={(p) => setPersonData(activeMonth, 'emil', p)}
            onClearZlantar={() => setZlantar('emil', null)}
          />
          <PersonCard
            name={data.settings.nameAnna}
            data={month.anna}
            zlantar={data.zlantar.anna}
            onChange={(p) => setPersonData(activeMonth, 'anna', p)}
            onClearZlantar={() => setZlantar('anna', null)}
          />
        </div>

        <ResultCard
          emilKvar={emilKvar}
          annaKvar={annaKvar}
          nameEmil={data.settings.nameEmil}
          nameAnna={data.settings.nameAnna}
        />

        <BufferCard
          prevBuffer={prevBuffer}
          newBuffer={newBuffer}
          settings={data.settings}
          month={month}
          nameEmil={data.settings.nameEmil}
          nameAnna={data.settings.nameAnna}
          onOverride={(e, a) => setBufferOverride(activeMonth, e, a)}
        />

        <ConsumptionChart {...consumption} />

        <SettingsPanel
          settings={data.settings}
          onChange={setSettings}
          githubRepo={repo}
          onGitHubDisconnect={isLocal ? () => { window.location.reload() } : undefined}
          onResetAuth={!isLocal ? () => { clearAuth(); window.location.reload() } : undefined}
        />
      </div>
    </div>
  )
}
