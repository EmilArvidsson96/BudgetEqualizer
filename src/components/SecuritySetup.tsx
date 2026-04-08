import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { generateTotpSecret, totpUri, verifyTotp } from '../utils/crypto'
import { setupAuth } from '../utils/authStore'

interface Props {
  repo: string
  token: string
  onDone: (repo: string, token: string) => void
}

type Step = 'pin' | 'totp'

export function SecuritySetup({ repo, token, onDone }: Props) {
  const [step, setStep] = useState<Step>('pin')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')

  // Generated once for this setup session
  const [totpSecret] = useState(generateTotpSecret)
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState('')
  const [loading, setLoading] = useState(false)

  const qrValue = totpUri(totpSecret, `BudgetEqualizer (${repo})`)

  const handlePinNext = () => {
    if (pin.length < 4) {
      setPinError('PIN-koden måste vara minst 4 tecken.')
      return
    }
    if (pin !== pinConfirm) {
      setPinError('PIN-koderna matchar inte.')
      return
    }
    setPinError('')
    setStep('totp')
  }

  const handleFinish = async () => {
    setLoading(true)
    setTotpError('')
    const valid = await verifyTotp(totpSecret, totpCode)
    if (!valid) {
      setLoading(false)
      setTotpError('Fel engångskod. Kontrollera att din autentiseringsapp är synkroniserad och försök igen.')
      setTotpCode('')
      return
    }
    await setupAuth(pin, totpSecret, repo, token)
    setLoading(false)
    onDone(repo, token)
  }

  if (step === 'pin') {
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
                onKeyDown={(e) => e.key === 'Enter' && handlePinNext()}
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
                onKeyDown={(e) => e.key === 'Enter' && handlePinNext()}
                placeholder="Upprepa PIN-koden"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
              />
            </div>
          </div>

          {pinError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{pinError}</p>
          )}

          <button
            type="button"
            disabled={!pin || !pinConfirm}
            onClick={handlePinNext}
            className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
              hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nästa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Konfigurera MFA</h1>
          <p className="text-sm text-gray-500">
            Skanna QR-koden med din autentiseringsapp (t.ex. Google Authenticator eller Authy).
          </p>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
          <QRCodeSVG value={qrValue} size={180} />
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
            Kan inte skanna? Ange koden manuellt
          </summary>
          <p className="mt-2 font-mono text-gray-600 bg-gray-50 rounded-lg p-3 break-all select-all leading-relaxed">
            {totpSecret}
          </p>
        </details>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Verifiera — ange engångskoden från appen
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
            placeholder="000 000"
            maxLength={7}
            autoFocus
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
              transition-colors tracking-widest text-center"
          />
        </div>

        {totpError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{totpError}</p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            disabled={loading || totpCode.replace(/\s/g, '').length !== 6}
            onClick={handleFinish}
            className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl
              hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sparar…' : 'Aktivera säkerhet'}
          </button>

          <button
            type="button"
            onClick={() => setStep('pin')}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Tillbaka
          </button>
        </div>
      </div>
    </div>
  )
}
