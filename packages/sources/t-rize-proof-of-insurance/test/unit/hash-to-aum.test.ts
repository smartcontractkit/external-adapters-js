import { createHash } from 'crypto'
import { hashToAum } from '../../src/transport/insurance-proof'

describe('hashToAum', () => {
  const TWO_POW_191 = BigInt(2) ** BigInt(191)

  it('returns a numeric string for a simple hex hash', () => {
    const hash = '0xabc123def456'
    const result = hashToAum(hash)

    // Verify result is a numeric string
    expect(typeof result).toBe('string')
    expect(/^\d+$/.test(result)).toBe(true)
  })

  it('computes correct modulo result for known input', () => {
    const hash = 'test-hash-input'
    const result = hashToAum(hash)

    // Manually compute expected value
    const sha256Hash = createHash('sha256').update(hash).digest('hex')
    const hashBigInt = BigInt('0x' + sha256Hash)
    const expected = (hashBigInt % TWO_POW_191).toString()

    expect(result).toBe(expected)
  })

  it('returns result less than 2^191', () => {
    const hash = '0xabc123def456'
    const result = BigInt(hashToAum(hash))

    expect(result < TWO_POW_191).toBe(true)
  })

  it('handles empty string input', () => {
    const hash = ''
    const result = hashToAum(hash)

    // Empty string should still produce a valid SHA256 and result
    const sha256Hash = createHash('sha256').update(hash).digest('hex')
    const hashBigInt = BigInt('0x' + sha256Hash)
    const expected = (hashBigInt % TWO_POW_191).toString()

    expect(result).toBe(expected)
  })

  it('produces different results for different inputs', () => {
    const hash1 = 'input1'
    const hash2 = 'input2'

    const result1 = hashToAum(hash1)
    const result2 = hashToAum(hash2)

    expect(result1).not.toBe(result2)
  })

  it('produces consistent results for same input', () => {
    const hash = '0xdeadbeef'

    const result1 = hashToAum(hash)
    const result2 = hashToAum(hash)

    expect(result1).toBe(result2)
  })

  it('handles long hash input', () => {
    const longHash = '0x' + 'a'.repeat(256)
    const result = hashToAum(longHash)

    expect(typeof result).toBe('string')
    expect(/^\d+$/.test(result)).toBe(true)
    expect(BigInt(result) < TWO_POW_191).toBe(true)
  })
})
