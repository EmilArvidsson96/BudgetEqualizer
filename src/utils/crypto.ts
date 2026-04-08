// ── Base32 (RFC 4648) ─────────────────────────────────────────────────────────

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string): Uint8Array {
  const str = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  const output: number[] = []
  let bits = 0, value = 0
  for (const char of str) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}

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

// ── TOTP (RFC 6238 / RFC 4226, HMAC-SHA1) ────────────────────────────────────

export function generateTotpSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)))
}

async function hotp(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(base32Decode(secret)),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  // Counter as 8-byte big-endian
  const msg = new Uint8Array(8)
  let c = counter
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff
    c = Math.floor(c / 256)
  }
  const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg))
  const offset = hash[19] & 0x0f
  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000
  return code.toString().padStart(6, '0')
}

/** Verify a 6-digit TOTP code with ±1 step tolerance for clock skew. */
export async function verifyTotp(secret: string, code: string): Promise<boolean> {
  const t = Math.floor(Date.now() / 1000 / 30)
  const cleaned = code.replace(/\s/g, '')
  for (const step of [t - 1, t, t + 1]) {
    if ((await hotp(secret, step)) === cleaned) return true
  }
  return false
}

export function totpUri(secret: string, label: string): string {
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&algorithm=SHA1&digits=6&period=30`
}
