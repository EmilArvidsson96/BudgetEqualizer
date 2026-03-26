import { useState, useRef } from 'react'

interface Props {
  instructions: string[]
  onChange: (instructions: string[]) => void
}

export function InstructionsPanel({ instructions, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newItem, setNewItem] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  // Drag state
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(instructions[idx])
  }

  const commitEdit = () => {
    if (editingIdx === null) return
    const trimmed = editValue.trim()
    if (trimmed) {
      const next = [...instructions]
      next[editingIdx] = trimmed
      onChange(next)
    }
    setEditingIdx(null)
  }

  const remove = (idx: number) => {
    onChange(instructions.filter((_, i) => i !== idx))
  }

  const commitAdd = () => {
    const trimmed = newItem.trim()
    if (trimmed) onChange([...instructions, trimmed])
    setNewItem('')
    setAddingNew(false)
  }

  const onDragStart = (idx: number) => {
    dragIdx.current = idx
  }

  const onDragEnter = (idx: number) => {
    dragOverIdx.current = idx
  }

  const onDragEnd = () => {
    const from = dragIdx.current
    const to = dragOverIdx.current
    if (from !== null && to !== null && from !== to) {
      const next = [...instructions]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      onChange(next)
    }
    dragIdx.current = null
    dragOverIdx.current = null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Process
        </h2>
        <span
          className={`text-gray-400 text-sm transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-1.5">
          {instructions.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-start gap-2.5 group cursor-grab active:cursor-grabbing rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
            >
              {/* Drag handle */}
              <span className="text-gray-300 group-hover:text-gray-400 mt-0.5 flex-shrink-0 select-none text-xs leading-none pt-0.5">
                ⠿
              </span>

              {/* Step number */}
              <span className="text-xs text-gray-300 flex-shrink-0 w-4 pt-0.5">{idx + 1}.</span>

              {/* Content or edit input */}
              {editingIdx === idx ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditingIdx(null)
                  }}
                  className="flex-1 text-sm text-gray-700 border-b border-blue-300 focus:outline-none bg-transparent"
                />
              ) : (
                <span
                  className="flex-1 text-sm text-gray-600"
                  onDoubleClick={() => startEdit(idx)}
                  title="Dubbelklicka för att redigera"
                >
                  {item}
                </span>
              )}

              {/* Edit / remove buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(idx)}
                  className="text-gray-300 hover:text-blue-400 transition-colors text-xs px-1"
                  title="Redigera"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xs px-1"
                  title="Ta bort"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Add new instruction */}
          {addingNew ? (
            <div className="flex items-center gap-2 pl-9 pt-1">
              <input
                autoFocus
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onBlur={commitAdd}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd()
                  if (e.key === 'Escape') {
                    setNewItem('')
                    setAddingNew(false)
                  }
                }}
                placeholder="Ny instruktion…"
                className="flex-1 text-sm text-gray-700 border-b border-blue-300 focus:outline-none bg-transparent pb-0.5"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="ml-9 mt-1 text-xs text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <span className="text-base leading-none">+</span>
              Lägg till steg
            </button>
          )}
        </div>
      )}
    </div>
  )
}
