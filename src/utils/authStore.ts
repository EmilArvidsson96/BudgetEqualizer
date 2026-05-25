import { deriveKey, encryptData, decryptData, toBase64, fromBase64 } from './crypto'

const AUTH_KEY = 'budget-auth-v1'

// Legacy plaintext keys written by the old (pre-auth) GitHubSetup flow
export const LEGACY_REPO_KEY = 'budget-github-repo'
export const LEGACY_TOKEN_KEY = 'budget-github-token'

interface AuthPayload {
  repo: string
  token: string
}

/** True if encrypted auth config exists in localStorage on this device. */
export function isAuthSetup(): boolean {
  return !!localStorage.getItem(AUTH_KEY)
}

/** Returns plaintext credentials left over from the pre-auth setup, or null. */
export function getLegacyConfig(): { repo: string; token: string } | null {
  const repo = localStorage.getItem(LEGACY_REPO_KEY)
  const token = localStorage.getItem(LEGACY_TOKEN_KEY)
  return repo && token ? { repo, token } : null
}

/**
 * Encrypts credentials with the given PIN and stores them.
 * Also removes any legacy plaintext keys.
 */
export async function setupAuth(
  pin: string,
  repo: string,
  token: string,
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(pin, salt)
  const payload: AuthPayload = { repo, token }
  const encrypted = await encryptData(key, JSON.stringify(payload))
  localStorage.setItem(AUTH_KEY, JSON.stringify({ salt: toBase64(salt), encrypted }))
  localStorage.removeItem(LEGACY_REPO_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

/**
 * Attempts to unlock with the given PIN.
 * Returns credentials on success, null if the PIN is wrong.
 */
export async function unlock(
  pin: string,
): Promise<{ repo: string; token: string } | null> {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    const { salt, encrypted } = JSON.parse(raw) as { salt: string; encrypted: string }
    const key = await deriveKey(pin, fromBase64(salt))
    // decryptData throws if the key is wrong (AES-GCM authentication tag mismatch)
    const plaintext = await decryptData(key, encrypted)
    // Older payloads also contained a totpSecret field — we ignore it.
    const { repo, token } = JSON.parse(plaintext) as AuthPayload
    return { repo, token }
  } catch {
    return null
  }
}

/** Wipes all auth data from localStorage (full reset). */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}
