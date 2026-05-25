import { useState } from 'react'
import { unlock } from '../utils/authStore'

interface Props {
  onUnlock: (repo: string, token: string) => void
}

export function LockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!pin) return
    setLoading(true)
    setError('')
    const result = await unlock(pin)
    setLoading(false)
    if (result) {
      onUnlock(result.repo, result.token)
    } else {
      setError('Fel PIN-kod.')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-xs space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Lås upp</h1>
          <p className="text-sm text-gray-500">
            Ange PIN-kod för att fortsätta.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">PIN-kod</label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          disabled={loading || !pin}
          onClick={handleSubmit}
          className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
            hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Låser upp…' : 'Lås upp'}
        </button>
      </div>
    </div>
  )
}
