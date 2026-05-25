import { useRef, useState } from 'react'
import { StoredData } from '../types'
import { DatasetMeta } from '../utils/dataApi'
import { withDefaults } from '../utils/storage'
import { ZlantarPayload, isZlantarPayload } from '../utils/zlantar'

interface Props {
  datasets: DatasetMeta[]
  currentName: string
  currentData: StoredData
  onSwitch: (name: string) => Promise<void>
  onCreate: (name: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
  onImport: (name: string, data: StoredData) => Promise<void>
  onZlantarImport: (payload: ZlantarPayload) => Promise<void>
}

export function DatasetPanel({
  datasets,
  currentName,
  currentData,
  onSwitch,
  onCreate,
  onDelete,
  onImport,
  onZlantarImport,
}: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  const handleSwitch = (name: string) => wrap(() => onSwitch(name))

  const handleDeleteClick = (name: string) => {
    if (confirmDelete === name) {
      wrap(async () => {
        await onDelete(name)
        setConfirmDelete(null)
      })
    } else {
      setConfirmDelete(name)
    }
  }

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    wrap(async () => {
      await onCreate(trimmed)
      setNewName('')
      setCreatingNew(false)
    })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = file.name.replace(/\.json$/i, '')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (isZlantarPayload(parsed)) {
          wrap(() => onZlantarImport(parsed))
        } else {
          wrap(() => onImport(name, withDefaults(parsed)))
        }
      } catch {
        alert('Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setConfirmDelete(null); setCreatingNew(false) }}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Filer
          </h2>
          {currentName && (
            <span className="text-xs text-gray-500 font-medium">{currentName}</span>
          )}
        </div>
        <span
          className={`text-gray-400 text-sm transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-1">
          {/* Dataset list */}
          {datasets.length === 0 && (
            <p className="text-xs text-gray-400 py-2">Inga sparade filer</p>
          )}

          {datasets.map((ds) => {
            const isActive = ds.name === currentName
            const isConfirming = confirmDelete === ds.name

            return (
              <div
                key={ds.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
                  isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Active indicator */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-blue-500' : 'bg-transparent'
                  }`}
                />

                {/* Name */}
                <span
                  className={`flex-1 text-sm truncate ${
                    isActive ? 'font-medium text-blue-700' : 'text-gray-600'
                  }`}
                >
                  {ds.name}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!isActive && !isConfirming && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSwitch(ds.name)}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 disabled:opacity-40"
                    >
                      Öppna
                    </button>
                  )}

                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-500">Radera?</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteClick(ds.name)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        Ja
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteClick(ds.name)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors px-1 disabled:opacity-40"
                      title="Radera"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Divider */}
          <div className="pt-2 border-t border-gray-50 flex flex-wrap items-center gap-2">
            {/* Create new */}
            {creatingNew ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') { setCreatingNew(false); setNewName('') }
                  }}
                  placeholder="Namn på ny fil…"
                  className="flex-1 min-w-0 text-sm border-b border-blue-300 focus:outline-none bg-transparent pb-0.5 text-gray-700"
                />
                <button
                  type="button"
                  disabled={busy || !newName.trim()}
                  onClick={handleCreate}
                  className="text-xs font-medium text-blue-500 hover:text-blue-700 disabled:opacity-40"
                >
                  Skapa
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatingNew(false); setNewName('') }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Avbryt
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setCreatingNew(true)}
                className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                <span className="text-base leading-none">+</span>
                Ny fil
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Import */}
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1 disabled:opacity-40"
                title="Importera JSON-fil"
              >
                <span>↑</span> Importera
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />

              {/* Export */}
              <button
                type="button"
                disabled={!currentName}
                onClick={handleExport}
                className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1 disabled:opacity-40"
                title="Exportera nuvarande fil som JSON"
              >
                <span>↓</span> Exportera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
