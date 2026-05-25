// ── Helpers ───────────────────────────────────────────────────────────────────

export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

export function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

// ── PBKDF2 + AES-GCM ─────────────────────────────────────────────────────────

/**
 * Derives a 256-bit AES-GCM key from a PIN using PBKDF2-SHA256.
 * 100 000 iterations balances security with acceptable unlock latency.
 */
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: 100_000 },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** AES-GCM encrypt. Returns base64(iv‖ciphertext). */
export async function encryptData(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  const combined = new Uint8Array(12 + ct.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ct), 12)
  return toBase64(combined)
}

/** AES-GCM decrypt. Throws if the key or ciphertext is wrong. */
export async function decryptData(key: CryptoKey, ciphertext: string): Promise<string> {
  const data = fromBase64(ciphertext)
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: data.slice(0, 12) },
    key,
    data.slice(12),
  )
  return new TextDecoder().decode(pt)
}
