import * as crypto from 'crypto'
import {
  extractSignedPayload,
  isFresh,
  isSaneSignature,
  parsePublicKeys,
  rescale,
} from '../../src/transport/utils'

describe('extractSignedPayload', () => {
  it('extracts the raw "data" substring, preserving exact bytes', () => {
    const raw = '{"data":{"value":"1","scale":"9"},"signature":"abc123"}'
    expect(extractSignedPayload(raw)).toBe('{"value":"1","scale":"9"}')
  })

  it('extracts "data" with Python-style spacing intact', () => {
    const raw = '{"data": {"value": "1", "scale": "9"}, "signature": "abc123"}'
    expect(extractSignedPayload(raw)).toBe('{"value": "1", "scale": "9"}')
  })

  it('throws when the "data" field is missing', () => {
    expect(() => extractSignedPayload('{"signature":"abc123"}')).toThrow(
      'Response body is missing a "data" field to verify',
    )
  })
})

describe('parsePublicKeys', () => {
  let pem: string

  beforeAll(() => {
    const { publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    pem = publicKey.export({ format: 'pem', type: 'spki' })
  })

  it('parses a JSON array containing a single PEM key', () => {
    const keys = parsePublicKeys(JSON.stringify([pem]))
    expect(keys).toHaveLength(1)
    expect(keys[0].asymmetricKeyType).toBe('ec')
  })

  it('parses a JSON array containing multiple PEM keys', () => {
    const keys = parsePublicKeys(JSON.stringify([pem, pem]))
    expect(keys).toHaveLength(2)
  })

  it('throws on malformed JSON', () => {
    expect(() => parsePublicKeys('not json')).toThrow(
      'INFRALABS_PUBLIC_KEYS must be a JSON array of PEM-encoded public key strings',
    )
  })

  it('throws on an empty array', () => {
    expect(() => parsePublicKeys('[]')).toThrow(
      'INFRALABS_PUBLIC_KEYS must be a non-empty JSON array of PEM-encoded public key strings',
    )
  })
})

describe('rescale', () => {
  it('divides when fromScale > 8 (the typical case: scale=9)', () => {
    // 1003968325 / 10^(9-8) = 100396832
    expect(rescale('1003968325', 9).toString()).toBe('100396832')
  })

  it('returns the value unchanged when fromScale equals 8', () => {
    expect(rescale('100396832', 8).toString()).toBe('100396832')
  })

  it('multiplies when fromScale < 8', () => {
    // 1003968 * 10^(8-7) = 10039680
    expect(rescale('1003968', 7).toString()).toBe('10039680')
  })

  it('handles a large scale difference (e.g. scale=18)', () => {
    // 10^17 / 10^(18-8) = 10^17 / 10^10 = 10^7
    expect(rescale('100000000000000000', 18).toString()).toBe('10000000')
  })

  it('preserves BigInt precision — no floating-point rounding', () => {
    // 99999999999999999 / 10 = 9999999999999999 (safe with BigInt, lossy with float64)
    expect(rescale('99999999999999999', 9).toString()).toBe('9999999999999999')
  })
})

describe('isFresh', () => {
  const nowMs = 1_704_107_471_000 // 2024-01-01T11:11:11.000Z
  const maxAgeSecs = 90_000 // 25 hours

  it('returns true when the value is fresh', () => {
    const timestamp = String(Math.floor(nowMs / 1000) - 3_600) // 1 hour ago
    expect(isFresh(timestamp, maxAgeSecs, nowMs)).toBe(true)
  })

  it('returns true when the value is exactly at the staleness boundary', () => {
    const timestamp = String(Math.floor(nowMs / 1000) - maxAgeSecs)
    expect(isFresh(timestamp, maxAgeSecs, nowMs)).toBe(true)
  })

  it('returns false when the value is one second past the boundary', () => {
    const timestamp = String(Math.floor(nowMs / 1000) - maxAgeSecs - 1)
    expect(isFresh(timestamp, maxAgeSecs, nowMs)).toBe(false)
  })

  it('returns false for a very old timestamp', () => {
    expect(isFresh('1', maxAgeSecs, nowMs)).toBe(false)
  })
})

describe('isSaneSignature', () => {
  const signedPayload =
    '{"value":"1003968325","scale":"9","timestamp":"1704103871","index_name":"USHP"}'
  let publicKeys: crypto.KeyObject[]
  let privateKey: crypto.KeyObject

  beforeAll(() => {
    const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    publicKeys = [pair.publicKey]
    privateKey = pair.privateKey
  })

  function sign(payload: string, key: crypto.KeyObject = privateKey): string {
    return crypto.createSign('SHA256').update(Buffer.from(payload, 'utf-8')).sign(key, 'base64')
  }

  it('returns true for a valid signature', () => {
    const sig = sign(signedPayload)
    expect(isSaneSignature(signedPayload, publicKeys, sig)).toBe(true)
  })

  it('returns true when the signature matches the second of multiple configured keys', () => {
    const { publicKey: otherPublicKey, privateKey: otherPrivateKey } = crypto.generateKeyPairSync(
      'ec',
      { namedCurve: 'P-256' },
    )
    const sig = sign(signedPayload, otherPrivateKey)
    expect(isSaneSignature(signedPayload, [...publicKeys, otherPublicKey], sig)).toBe(true)
  })

  it('returns false when the payload has been tampered with', () => {
    const sig = sign(signedPayload)
    const tamperedPayload = signedPayload.replace('"value":"1003968325"', '"value":"9999999999"')
    expect(isSaneSignature(tamperedPayload, publicKeys, sig)).toBe(false)
  })

  it('returns false when the signature is for a key not in the configured list', () => {
    const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    const sig = sign(signedPayload, otherPrivateKey)
    expect(isSaneSignature(signedPayload, publicKeys, sig)).toBe(false)
  })

  it('returns false for a corrupted signature', () => {
    expect(isSaneSignature(signedPayload, publicKeys, 'bm90YXZhbGlkc2lnbmF0dXJl')).toBe(false)
  })
})
