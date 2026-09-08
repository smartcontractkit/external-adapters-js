import * as crypto from 'crypto'

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

function makeResponse(
  opts: { timestamp: string; tamperedValue?: string },
  privateKey: crypto.KeyObject,
): string {
  // The server signs the compact JSON encoding of "data"; we replicate that exactly here so
  // signature verification matches byte-for-byte, then optionally swap in a tampered value
  // AFTER signing so the final body no longer matches the (still valid-looking) signature.
  const data = {
    index_name: 'USHP',
    value: VALUE,
    scale: SCALE,
    timestamp: opts.timestamp,
    schema_version: '1',
  }
  const dataJson = JSON.stringify(data)
  const signature = crypto
    .createSign('SHA256')
    .update(Buffer.from(dataJson, 'utf-8'))
    .sign(privateKey, 'base64')

  const finalData = opts.tamperedValue ? { ...data, value: opts.tamperedValue } : data
  return `{"data":${JSON.stringify(finalData)},"signature":"${signature}"}`
}

export function createFixtures(privateKey: crypto.KeyObject) {
  return {
    // Valid response, recent timestamp
    success: makeResponse({ timestamp: FRESH_TIMESTAMP }, privateKey),
    // Valid signature but timestamp is far in the past
    stale: makeResponse({ timestamp: STALE_TIMESTAMP }, privateKey),
    // Signature is valid for the original value, but value has been tampered after signing
    badSig: makeResponse({ timestamp: FRESH_TIMESTAMP, tamperedValue: '9999999999' }, privateKey),
  }
}
