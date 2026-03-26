import { useState, useEffect } from 'react'
import { Settings } from '../types'
import { evalExpr } from '../utils/math'

function NameField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const trimmed = local.trim()
          if (trimmed && trimmed !== value) onChange(trimmed)
          else setLocal(value)
        }}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
          focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
      />
    </div>
  )
}

function KrField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(String(Math.round(value)))
  useEffect(() => { setLocal(String(Math.round(value))) }, [value])
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => {
            const n = evalExpr(local)
            if (Number.isFinite(n) && n !== value) { onChange(n); setLocal(String(Math.round(n))) }
          }}
          className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">kr</span>
      </div>
    </div>
  )
}

interface GitHubFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  secret?: boolean
}

function GitHubField({ label, value, onChange, placeholder, secret }: GitHubFieldProps) {
  const [local, setLocal] = useState(value)
  const [show, setShow] = useState(false)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local.trim())}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full pl-3 pr-12 py-2 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-gray-500"
          >
            {show ? 'Dölj' : 'Visa'}
          </button>
        )}
      </div>
    </div>
  )
}

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  githubRepo?: string
  githubToken?: string
  onGitHubChange?: (repo: string, token: string) => void
  onGitHubDisconnect?: () => void
}

export function SettingsPanel({
  settings,
  onChange,
  githubRepo = '',
  githubToken = '',
  onGitHubChange,
  onGitHubDisconnect,
}: Props) {
  const [open, setOpen] = useState(false)
  const [ghRepo, setGhRepo] = useState(githubRepo)
  const [ghToken, setGhToken] = useState(githubToken)

  const setNum = (k: keyof Settings) => (v: number) => onChange({ ...settings, [k]: v })
  const setStr = (k: keyof Settings) => (v: string) => onChange({ ...settings, [k]: v })
  const n1 = settings.nameEmil
  const n2 = settings.nameAnna

  const ghConnected = !!(githubRepo && githubToken)
  const ghChanged = ghRepo.trim() !== githubRepo || ghToken.trim() !== githubToken

  return (
    <div className="pb-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className={`inline-block transition-transform duration-150 ${open ? 'rotate-90' : ''}`}>›</span>
        Inställningar
      </button>

      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[48rem] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

          {/* Names */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Namn</p>
            <div className="grid grid-cols-2 gap-3">
              <NameField label="Person 1" value={settings.nameEmil} onChange={setStr('nameEmil')} />
              <NameField label="Person 2" value={settings.nameAnna} onChange={setStr('nameAnna')} />
            </div>
          </div>

          {/* Buffer targets */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Buffertsalmål</p>
            <div className="grid grid-cols-2 gap-3">
              <KrField label={n1} value={settings.bufferMalEmil} onChange={setNum('bufferMalEmil')} />
              <KrField label={n2} value={settings.bufferMalAnna} onChange={setNum('bufferMalAnna')} />
            </div>
          </div>

          {/* Buffer starting balance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Buffert startsaldo</p>
            <div className="grid grid-cols-2 gap-3">
              <KrField label={n1} value={settings.initialBufferEmil} onChange={setNum('initialBufferEmil')} />
              <KrField label={n2} value={settings.initialBufferAnna} onChange={setNum('initialBufferAnna')} />
            </div>
          </div>

          {/* GitHub Sync */}
          {onGitHubChange && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">GitHub Sync</p>
                {ghConnected && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Ansluten
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <GitHubField
                  label="Repository"
                  value={ghRepo}
                  onChange={setGhRepo}
                  placeholder="användarnamn/repository"
                />
                <GitHubField
                  label="Personal Access Token"
                  value={ghToken}
                  onChange={setGhToken}
                  placeholder="github_pat_…"
                  secret
                />
              </div>

              <div className="flex items-center gap-2 mt-3">
                {ghChanged && (
                  <button
                    type="button"
                    onClick={() => onGitHubChange(ghRepo.trim(), ghToken.trim())}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Spara och återanslut
                  </button>
                )}
                {ghConnected && onGitHubDisconnect && (
                  <button
                    type="button"
                    onClick={onGitHubDisconnect}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Koppla från
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
