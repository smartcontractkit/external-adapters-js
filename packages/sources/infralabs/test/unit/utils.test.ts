import * as crypto from 'crypto'
import { buildUnsignedMessage, isFresh, isSaneSignature, rescale } from '../../src/transport/utils'

describe('buildUnsignedMessage', () => {
  it('strips the signature field from compact JSON (signature last)', () => {
    const raw = '{"value":"1","scale":"9","timestamp":"1","key_id":"arn:k","signature":"abc123"}'
    const expected = '{"value":"1","scale":"9","timestamp":"1","key_id":"arn:k"}'
    expect(buildUnsignedMessage(raw)).toBe(expected)
  })

  it('strips the signature field from compact JSON (signature in the middle)', () => {
    const raw = '{"value":"1","signature":"abc123","key_id":"arn:k"}'
    const expected = '{"value":"1","key_id":"arn:k"}'
    expect(buildUnsignedMessage(raw)).toBe(expected)
  })

  it('strips the signature field from Python-style JSON (space after colon and comma)', () => {
    const raw =
      '{"value": "1", "scale": "9", "timestamp": "1", "key_id": "arn:k", "signature": "abc123"}'
    const expected = '{"value": "1", "scale": "9", "timestamp": "1", "key_id": "arn:k"}'
    expect(buildUnsignedMessage(raw)).toBe(expected)
  })

  it('handles a long base64 signature value', () => {
    const sig = 'MEUCIQDmJz2+/abc123def456ghi789jklmno=='.repeat(2)
    const raw = `{"value":"1","signature":"${sig}"}`
    expect(buildUnsignedMessage(raw)).toBe('{"value":"1"}')
  })

  it('returns the input unchanged when no signature field is present', () => {
    const raw = '{"value":"1","scale":"9"}'
    expect(buildUnsignedMessage(raw)).toBe(raw)
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
  const rawBody =
    '{"value":"1003968325","scale":"9","timestamp":"1704103871","key_id":"arn:k","signature":"placeholder"}'
  let publicKey: crypto.KeyObject
  let privateKey: crypto.KeyObject

  beforeAll(() => {
    const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    publicKey = pair.publicKey
    privateKey = pair.privateKey
  })

  function sign(body: string): string {
    const unsigned = buildUnsignedMessage(body)
    return crypto
      .createSign('SHA256')
      .update(Buffer.from(unsigned, 'utf-8'))
      .sign(privateKey, 'base64')
  }

  it('returns true for a valid signature', () => {
    const sig = sign(rawBody)
    expect(isSaneSignature(rawBody, publicKey, sig)).toBe(true)
  })

  it('returns false when the body has been tampered with', () => {
    const sig = sign(rawBody)
    const tamperedBody = rawBody.replace('"value":"1003968325"', '"value":"9999999999"')
    expect(isSaneSignature(tamperedBody, publicKey, sig)).toBe(false)
  })

  it('returns false when the signature is for a different key', () => {
    const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    const sig = crypto
      .createSign('SHA256')
      .update(Buffer.from(buildUnsignedMessage(rawBody), 'utf-8'))
      .sign(otherPrivateKey, 'base64')
    expect(isSaneSignature(rawBody, publicKey, sig)).toBe(false)
  })

  it('returns false for a corrupted signature', () => {
    expect(isSaneSignature(rawBody, publicKey, 'bm90YXZhbGlkc2lnbmF0dXJl')).toBe(false)
  })
})
