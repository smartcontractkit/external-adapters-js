import * as crypto from 'crypto'

export const TEST_KEY_ID = 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
export const UNAVAILABLE_KEY_ID = 'arn:aws:kms:us-east-1:123456789012:key/unavailable-key-id'

// Fixed mock date: tests use jest.spyOn(Date, 'now') to return this value.
// Must be after 2018-01-01 so that providerIndicatedTimeUnixMs passes framework validation.
export const MOCK_DATE = new Date('2024-01-01T11:11:11.111Z')
const MOCK_TIMESTAMP_SECS = Math.floor(MOCK_DATE.getTime() / 1000)

// 1 hour before mock now — well within any reasonable USHP_MAX_STALENESS_SECS
export const FRESH_TIMESTAMP = String(MOCK_TIMESTAMP_SECS - 3600)
// Epoch — will always be stale
export const STALE_TIMESTAMP = '1'

export const VALUE = '1003968325'
export const SCALE = '9'

// Expected rescaled result: 1003968325 / 10^(9-8) = 100396832
export const EXPECTED_RESULT = '100396832'
export const EXPECTED_PRICE = 1.00396832

function signResponseBody(body: Record<string, string>, privateKey: crypto.KeyObject): string {
  const message = JSON.stringify(body)
  const signer = crypto.createSign('SHA256')
  signer.update(Buffer.from(message, 'utf-8'))
  // Default ECDSA output is DER-encoded, matching what the transport verifies
  return signer.sign(privateKey, 'base64')
}

function makeResponse(
  opts: { timestamp: string; keyId?: string; tamperedValue?: string },
  privateKey: crypto.KeyObject,
): string {
  const keyId = opts.keyId ?? TEST_KEY_ID
  // The server signs the body WITHOUT the signature field
  const unsignedBody = { value: VALUE, scale: SCALE, timestamp: opts.timestamp, key_id: keyId }
  const signature = signResponseBody(unsignedBody, privateKey)
  // Return the full body including signature; value may be tampered AFTER signing
  const responseBody = opts.tamperedValue
    ? {
        value: opts.tamperedValue,
        scale: SCALE,
        timestamp: opts.timestamp,
        key_id: keyId,
        signature,
      }
    : { ...unsignedBody, signature }
  return JSON.stringify(responseBody)
}

export function createFixtures(privateKey: crypto.KeyObject) {
  return {
    // Valid response, recent timestamp
    success: makeResponse({ timestamp: FRESH_TIMESTAMP }, privateKey),
    // Valid signature but timestamp is far in the past
    stale: makeResponse({ timestamp: STALE_TIMESTAMP }, privateKey),
    // Signature is valid for original value, but value has been tampered after signing
    badSig: makeResponse({ timestamp: FRESH_TIMESTAMP, tamperedValue: '9999999999' }, privateKey),
    // Valid response but key_id points to a KMS key the mock will reject
    kmsUnavailable: makeResponse(
      { timestamp: FRESH_TIMESTAMP, keyId: UNAVAILABLE_KEY_ID },
      privateKey,
    ),
  }
}
