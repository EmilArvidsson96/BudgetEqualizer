import { useState } from 'react'
import { setupAuth } from '../utils/authStore'

interface Props {
  repo: string
  token: string
  onDone: (repo: string, token: string) => void
}

export function SecuritySetup({ repo, token, onDone }: Props) {
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFinish = async () => {
    if (pin.length < 4) {
      setError('PIN-koden måste vara minst 4 tecken.')
      return
    }
    if (pin !== pinConfirm) {
      setError('PIN-koderna matchar inte.')
      return
    }
    setError('')
    setLoading(true)
    await setupAuth(pin, repo, token)
    setLoading(false)
    onDone(repo, token)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-xs space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Skapa PIN-kod</h1>
          <p className="text-sm text-gray-500">
            PIN-koden används för att kryptera dina inloggningsuppgifter lokalt på enheten.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PIN-kod</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
              autoFocus
              placeholder="Minst 4 tecken"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bekräfta PIN-kod</label>
            <input
              type="password"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
              placeholder="Upprepa PIN-koden"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          disabled={loading || !pin || !pinConfirm}
          onClick={handleFinish}
          className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
            hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sparar…' : 'Aktivera'}
        </button>
      </div>
    </div>
  )
}
