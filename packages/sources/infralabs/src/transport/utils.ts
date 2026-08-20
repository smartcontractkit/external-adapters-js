import * as crypto from 'crypto'

const OUTPUT_DECIMALS = 8

const DATA_FIELD_PATTERN = /"data"\s*:\s*(\{[^}]*\})/

/**
 * Extracts the raw substring of the "data" object from the response body, preserving the
 * exact bytes that were signed. Using a substring match rather than parse→stringify avoids
 * any serialisation mismatch between Python's json.dumps (which they sign with) and JS JSON.stringify.
 */
export function extractSignedPayload(rawResponseBody: string): string {
  const match = rawResponseBody.match(DATA_FIELD_PATTERN)
  if (!match) {
    throw new Error('Response body is missing a "data" field to verify')
  }
  return match[1]
}

/** Parses the INFRALABS_PUBLIC_KEYS config value (a JSON array of PEM-encoded public keys). */
export function parsePublicKeys(rawConfigValue: string): crypto.KeyObject[] {
  let pemKeys: unknown
  try {
    pemKeys = JSON.parse(rawConfigValue)
  } catch {
    throw new Error('INFRALABS_PUBLIC_KEYS must be a JSON array of PEM-encoded public key strings')
  }
  if (!Array.isArray(pemKeys) || pemKeys.length === 0) {
    throw new Error(
      'INFRALABS_PUBLIC_KEYS must be a non-empty JSON array of PEM-encoded public key strings',
    )
  }
  return pemKeys.map((pem) => crypto.createPublicKey(pem))
}

/** Verifies that `signature` (base64) over `signedPayload` matches any of `publicKeys` using SHA-256. */
export function isSaneSignature(
  signedPayload: string,
  publicKeys: crypto.KeyObject[],
  signature: string,
): boolean {
  const messageBytes = Buffer.from(signedPayload, 'utf-8')
  const signatureBytes = Buffer.from(signature, 'base64')

  return publicKeys.some((publicKey) =>
    crypto.createVerify('SHA256').update(messageBytes).verify(publicKey, signatureBytes),
  )
}

/** Returns true if the provider timestamp is within `maxAgeSecs` of `nowMs`. */
export function isFresh(timestamp: string, maxAgeSecs: number, nowMs: number): boolean {
  const ageSecs = Math.floor(nowMs / 1000) - parseInt(timestamp, 10) // nowMs (ms) → seconds; timestamp is Unix seconds
  return ageSecs <= maxAgeSecs
}

/**
 * Rescales an integer string from `fromScale` implied decimal places to
 * OUTPUT_DECIMALS (8) using BigInt arithmetic to avoid floating-point loss.
 *
 * Examples:
 *   rescale('1003968325', 9) → 100396832n  (9 → 8: divide by 10)
 *   rescale('10039683',   8) → 10039683n   (8 → 8: identity)
 *   rescale('1003968',    7) → 100396800n  (7 → 8: multiply by 10)
 */
export function rescale(value: string, fromScale: number): bigint {
  const diff = fromScale - OUTPUT_DECIMALS
  if (diff > 0) return BigInt(value) / 10n ** BigInt(diff)
  if (diff < 0) return BigInt(value) * 10n ** BigInt(-diff)
  return BigInt(value)
}
