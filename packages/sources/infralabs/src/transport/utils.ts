import * as crypto from 'crypto'

const OUTPUT_DECIMALS = 8

/**
 * Strips the "signature" field from the raw JSON response body, preserving the
 * exact remaining bytes. Using string manipulation rather than parse→stringify
 * avoids any serialisation mismatch between Python's json.dumps (which they sign with) and JS JSON.stringify (compact).
 */
export function buildUnsignedMessage(rawBody: string): string {
  return rawBody.replace(/,?\s*"signature"\s*:\s*"[^"]*"/, '')
}

/** Verifies that `signature` (base64) over the unsigned body (raw JSON minus the "signature" field) matches `publicKey` using SHA-256. */
export function isSaneSignature(
  rawResponseBody: string,
  publicKey: crypto.KeyObject,
  signature: string,
): boolean {
  const unsignedResponseBody = buildUnsignedMessage(rawResponseBody)

  let isSane = crypto
    .createVerify('SHA256')
    .update(Buffer.from(unsignedResponseBody, 'utf-8'))
    .verify(publicKey, Buffer.from(signature, 'base64'))

  return isSane
}

/** Returns true if the provider timestamp is within `maxAgeSecs` of `nowMs`. */
export function isFresh(timestamp: string, maxAgeSecs: number, nowMs: number): boolean {
  const ageSecs = Math.floor(nowMs / 1000) - parseInt(timestamp)
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
