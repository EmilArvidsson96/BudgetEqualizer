import { useState } from 'react'

interface Props {
  onConnect: (repo: string, token: string) => void
}

export function GitHubSetup({ onConnect }: Props) {
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    const r = repo.trim()
    const t = token.trim()
    if (!r || !t) return

    setTesting(true)
    setError('')

    try {
      const res = await fetch(`https://api.github.com/repos/${r}`, {
        headers: {
          Authorization: `Bearer ${t}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (res.status === 401) throw new Error('Ogiltigt token — kontrollera att det inte har löpt ut.')
      if (res.status === 404) throw new Error('Repository hittades inte — kontrollera stavning och att tokenet har åtkomst.')
      if (!res.ok) throw new Error(`Oväntat fel (${res.status})`)
      await res.json() // consume body

      // Verify Contents access by probing the repo root.
      // 403 = token missing Contents permission entirely.
      // 409 = empty repo (no commits yet) — allowed, we'll create the first file.
      const contentsRes = await fetch(`https://api.github.com/repos/${r}/contents/`, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' },
      })
      if (contentsRes.status === 403) {
        throw new Error('Tokenet saknar behörighet att läsa/skriva filer. Kontrollera att "Contents: Read and write" är valt under Permissions.')
      }
      onConnect(r, t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anslutning misslyckades')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-sm space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Anslut till GitHub</h1>
          <p className="text-sm text-gray-500">
            Datan sparas som JSON-filer i ditt GitHub-repository och är åtkomlig från alla enheter.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Repository
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="användarnamn/repository"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="github_pat_…"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
              >
                {showToken ? 'Dölj' : 'Visa'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Kräver <span className="font-medium">Contents: Read &amp; write</span> på ditt repository.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        {/* Connect button */}
        <button
          type="button"
          disabled={testing || !repo.trim() || !token.trim()}
          onClick={handleConnect}
          className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
            hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? 'Ansluter…' : 'Anslut'}
        </button>

        {/* Instructions */}
        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3.5 space-y-2">
          <p className="font-medium text-gray-500">Hur skapar jag ett token?</p>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed">
            <li>GitHub → Settings → Developer settings</li>
            <li>Personal access tokens → Fine-grained tokens → Generate new token</li>
            <li>Under <em>Repository access</em>, välj ditt repository</li>
            <li>Under <em>Permissions → Contents</em>, välj <strong>Read and write</strong></li>
            <li>Klicka Generate token och klistra in det ovan</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
