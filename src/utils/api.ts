import { StoredData } from '../types'

export interface DatasetMeta {
  name: string
  lastModified: number
}

export async function listDatasets(): Promise<DatasetMeta[]> {
  const res = await fetch('/api/datasets')
  if (!res.ok) return []
  return res.json()
}

export async function loadDataset(name: string): Promise<StoredData | null> {
  const res = await fetch(`/api/datasets/${encodeURIComponent(name)}`)
  if (!res.ok) return null
  return res.json()
}

export async function saveDataset(name: string, data: StoredData): Promise<void> {
  await fetch(`/api/datasets/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  })
}

export async function deleteDataset(name: string): Promise<void> {
  await fetch(`/api/datasets/${encodeURIComponent(name)}`, { method: 'DELETE' })
}
