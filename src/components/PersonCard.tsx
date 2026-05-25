import { PersonData, ZlantarSnapshot } from '../types'
import { evalExpr, formatKr } from '../utils/math'
import { prettyBankName, translateAccountType } from '../utils/zlantar'
import { Field } from './Field'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  name: string
  data: PersonData
  zlantar?: ZlantarSnapshot | null
  excludeAccountNumbers?: Set<string>
  onChange: (d: PersonData) => void
  onClearZlantar?: () => void
}

export function PersonCard({ name, data, zlantar, excludeAccountNumbers, onChange, onClearZlantar }: Props) {
  const set =
    (k: keyof PersonData) =>
    (v: string) =>
      onChange({ ...data, [k]: v })

  // Savings badge
  const sparTotal =
    evalExpr(data.sparBuffert) +
    evalExpr(data.sparResa) +
    evalExpr(data.sparPension) +
    evalExpr(data.sparKapital)
  const hasSpar = sparTotal > 0

  // Buffer section badge: net impact on buffer (positive = buffer grows)
  const lanatN = evalExpr(data.lanatFranBuffert)
  const kvarN = evalExpr(data.kvarPaDispenser)
  const hasBuffer = lanatN !== 0 || kvarN !== 0
  const bufferNet = kvarN - lanatN
  const bufferBadge = hasBuffer
    ? `${bufferNet >= 0 ? '+' : ''}${formatKr(bufferNet)}`
    : undefined
  const bufferBadgeColor = bufferNet >= 0 ? 'text-green-500' : 'text-red-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-gray-800 text-sm">{name}</h2>

      <Field label="Lön" value={data.lon} onChange={set('lon')} />

      <Field
        label="Övrig inkomst"
        value={data.ovrigInkomst}
        onChange={set('ovrigInkomst')}
      />
      {data.ovrigInkomst !== '' && (
        <input
          type="text"
          value={data.ovrigInkomstKommentar}
          onChange={(e) => set('ovrigInkomstKommentar')(e.target.value)}
          placeholder="Vad? (t.ex. julbonus)"
          className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-lg
            focus:outline-none focus:border-blue-300 text-gray-600 bg-gray-50
            placeholder:text-gray-300"
        />
      )}

      <Field
        label="Ska dras"
        value={data.skaDras}
        onChange={set('skaDras')}
        hint="Alla fakturor & kostnader"
      />

      <CollapsibleSection
        title="Sparande"
        defaultOpen={hasSpar}
        badge={hasSpar ? formatKr(sparTotal) : undefined}
        badgeColor="text-blue-400"
      >
        <Field
          label="Buffert"
          value={data.sparBuffert}
          onChange={set('sparBuffert')}
        />
        <Field
          label="Resa"
          value={data.sparResa}
          onChange={set('sparResa')}
        />
        <Field
          label="Pension"
          value={data.sparPension}
          onChange={set('sparPension')}
        />
        <Field
          label="Kapital"
          value={data.sparKapital}
          onChange={set('sparKapital')}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Buffert"
        defaultOpen={hasBuffer}
        badge={bufferBadge}
        badgeColor={bufferBadgeColor}
      >
        <Field
          label="Lånat från buffert"
          value={data.lanatFranBuffert}
          onChange={set('lanatFranBuffert')}
          hint="Pengar tagna från bufferten"
        />
        <Field
          label="Kvar på dispenser"
          value={data.kvarPaDispenser}
          onChange={set('kvarPaDispenser')}
          hint="Återförs till bufferten"
        />
      </CollapsibleSection>

      {zlantar && zlantar.banks.length > 0 && (
        <ZlantarAccounts snapshot={zlantar} exclude={excludeAccountNumbers} onClear={onClearZlantar} />
      )}
    </div>
  )
}

function ZlantarAccounts({
  snapshot,
  exclude,
  onClear,
}: {
  snapshot: ZlantarSnapshot
  exclude?: Set<string>
  onClear?: () => void
}) {
  const visibleBanks = snapshot.banks
    .map((bank) => ({
      ...bank,
      accounts: bank.accounts.filter((acc) => !exclude?.has(acc.account_number)),
    }))
    .filter((bank) => bank.accounts.length > 0)

  const total = visibleBanks.reduce(
    (s, b) => s + b.accounts.reduce((bs, a) => bs + a.balance, 0),
    0,
  )
  const importedDate = (() => {
    try { return new Date(snapshot.importedAt).toLocaleDateString('sv-SE') }
    catch { return '' }
  })()

  if (visibleBanks.length === 0) return null

  return (
    <CollapsibleSection
      title="Konton"
      defaultOpen
      badge={formatKr(total)}
      badgeColor={total >= 0 ? 'text-gray-500' : 'text-red-500'}
    >
      <div className="space-y-3">
        {visibleBanks.map((bank) => (
          <div key={bank.name} className="space-y-1">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              {prettyBankName(bank.name)}
            </div>
            {bank.accounts.map((acc) => (
              <div
                key={acc.account_number || `${acc.name}-${acc.account_index}`}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-gray-700 truncate">{acc.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {translateAccountType(acc.type)} · {acc.account_number}
                  </div>
                </div>
                <div
                  className={`tabular-nums ${
                    acc.balance < 0 ? 'text-red-500' : 'text-gray-700'
                  }`}
                >
                  {formatKr(acc.balance)}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-[10px] text-gray-400">
            {importedDate ? `Importerad ${importedDate}` : ''}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
            >
              Ta bort
            </button>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}
