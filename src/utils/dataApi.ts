import type { StoredData } from '../types'

export interface DatasetMeta {
  name: string
  lastModified: number
}

export interface DataApi {
  listDatasets(): Promise<DatasetMeta[]>
  loadDataset(name: string): Promise<StoredData | null>
  saveDataset(name: string, data: StoredData): Promise<void>
  deleteDataset(name: string): Promise<void>
}

// ── Local (Vite dev-server middleware) ────────────────────────────────────────

export function createLocalApi(): DataApi {
  const base = '/api/datasets'
  return {
    async listDatasets() {
      const res = await fetch(base)
      return res.ok ? res.json() : []
    },
    async loadDataset(name) {
      const res = await fetch(`${base}/${encodeURIComponent(name)}`)
      return res.ok ? res.json() : null
    },
    async saveDataset(name, data) {
      await fetch(`${base}/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2),
      })
    },
    async deleteDataset(name) {
      await fetch(`${base}/${encodeURIComponent(name)}`, { method: 'DELETE' })
    },
  }
}

// ── GitHub Contents API ───────────────────────────────────────────────────────

function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function b64decode(str: string): string {
  const binary = atob(str.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function ghFetch(
  repo: string,
  token: string,
  path: string,
  init?: RequestInit,
) {
  return fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    ...init,
    headers: { ...ghHeaders(token), ...((init?.headers as Record<string, string>) ?? {}) },
  })
}

async function getSha(
  repo: string,
  token: string,
  path: string,
): Promise<string | undefined> {
  const res = await ghFetch(repo, token, path)
  return res.ok ? (await res.json()).sha : undefined
}

export function createGitHubApi(repo: string, token: string): DataApi {
  const dir = 'data'

  return {
    async listDatasets() {
      const res = await ghFetch(repo, token, dir)
      if (!res.ok) return []
      const files: Array<{ name: string; type: string }> = await res.json()
      return files
        .filter((f) => f.type === 'file' && f.name.endsWith('.json'))
        .map((f) => ({ name: f.name.slice(0, -5), lastModified: 0 }))
    },

    async loadDataset(name) {
      const res = await ghFetch(repo, token, `${dir}/${encodeURIComponent(name)}.json`)
      if (!res.ok) return null
      const file = await res.json()
      try {
        return JSON.parse(b64decode(file.content))
      } catch {
        return null
      }
    },

    async saveDataset(name, data) {
      const path = `${dir}/${encodeURIComponent(name)}.json`
      const sha = await getSha(repo, token, path)
      const res = await ghFetch(repo, token, path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `budget: spara ${name}`,
          content: b64encode(JSON.stringify(data, null, 2)),
          ...(sha ? { sha } : {}),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`GitHub: ${(err as { message?: string }).message ?? res.status}`)
      }
    },

    async deleteDataset(name) {
      const path = `${dir}/${encodeURIComponent(name)}.json`
      const sha = await getSha(repo, token, path)
      if (!sha) return
      await ghFetch(repo, token, path, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `budget: radera ${name}`, sha }),
      })
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildApi(repo = '', token = ''): { api: DataApi; isGitHub: boolean } {
  if (repo && token) return { api: createGitHubApi(repo, token), isGitHub: true }
  return { api: createLocalApi(), isGitHub: false }
}
