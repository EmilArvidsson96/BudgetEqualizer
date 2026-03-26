import { PersonData } from '../types'
import { evalExpr, formatKr } from '../utils/math'
import { Field } from './Field'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  name: string
  data: PersonData
  onChange: (d: PersonData) => void
}

export function PersonCard({ name, data, onChange }: Props) {
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
    </div>
  )
}
