import { ZlantarSnapshot } from '../types'
import { prettyBankName, translateAccountType } from '../utils/zlantar'
import { formatKr } from '../utils/math'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  sharedNumbers: Set<string>
  snapshotEmil: ZlantarSnapshot | null
  snapshotAnna: ZlantarSnapshot | null
  nameEmil: string
  nameAnna: string
}

export function SharedAccountsCard({ sharedNumbers, snapshotEmil, snapshotAnna, nameEmil, nameAnna }: Props) {
  if (sharedNumbers.size === 0) return null

  // Use whichever snapshot exists to enumerate shared accounts; balances come from each side
  const source = snapshotEmil ?? snapshotAnna
  if (!source) return null

  const balanceMap = (snapshot: ZlantarSnapshot | null): Map<string, number> => {
    const m = new Map<string, number>()
    if (!snapshot) return m
    for (const bank of snapshot.banks) {
      for (const acc of bank.accounts) {
        m.set(acc.account_number, acc.balance)
      }
    }
    return m
  }

  const emilBalances = balanceMap(snapshotEmil)
  const annaBalances = balanceMap(snapshotAnna)

  // Group shared accounts by bank (from source snapshot)
  const banks = source.banks
    .map((bank) => ({
      name: bank.name,
      accounts: bank.accounts.filter((acc) => sharedNumbers.has(acc.account_number)),
    }))
    .filter((bank) => bank.accounts.length > 0)

  if (banks.length === 0) return null

  const totalEmil = [...sharedNumbers].reduce((s, n) => s + (emilBalances.get(n) ?? 0), 0)
  const totalAnna = [...sharedNumbers].reduce((s, n) => s + (annaBalances.get(n) ?? 0), 0)
  const grandTotal = (snapshotEmil ? totalEmil : 0) + (snapshotAnna && !snapshotEmil ? totalAnna : snapshotAnna ? totalAnna : 0)
  const showBothSides = !!snapshotEmil && !!snapshotAnna

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <CollapsibleSection
        title="Gemensamma konton"
        defaultOpen
        badge={showBothSides ? undefined : formatKr(grandTotal)}
        badgeColor="text-gray-500"
      >
        <div className="space-y-3">
          {banks.map((bank) => (
            <div key={bank.name} className="space-y-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                {prettyBankName(bank.name)}
              </div>

              {showBothSides && (
                <div className="flex justify-end gap-3 text-[10px] text-gray-400 pr-0 mb-0.5">
                  <span className="w-20 text-right">{nameEmil}</span>
                  <span className="w-20 text-right">{nameAnna}</span>
                </div>
              )}

              {bank.accounts.map((acc) => {
                const balEmil = emilBalances.get(acc.account_number)
                const balAnna = annaBalances.get(acc.account_number)
                return (
                  <div
                    key={acc.account_number}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-700 truncate">{acc.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {translateAccountType(acc.type)} · {acc.account_number}
                      </div>
                    </div>
                    {showBothSides ? (
                      <div className="flex gap-3 flex-shrink-0">
                        <span className={`w-20 text-right tabular-nums ${(balEmil ?? 0) < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                          {balEmil !== undefined ? formatKr(balEmil) : '—'}
                        </span>
                        <span className={`w-20 text-right tabular-nums ${(balAnna ?? 0) < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                          {balAnna !== undefined ? formatKr(balAnna) : '—'}
                        </span>
                      </div>
                    ) : (
                      <span className={`tabular-nums ${acc.balance < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {formatKr(acc.balance)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
