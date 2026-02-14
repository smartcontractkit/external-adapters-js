import { computeAumFromSignature } from '../../src/transport/proof-of-insurance'

describe('computeAumFromSignature', () => {
  const TWO_POW_191 = BigInt(2) ** BigInt(191)

  it('computes correct AUM for signature 0xabc123def456', () => {
    const result = computeAumFromSignature('0xabc123def456')
    expect(result).toBe('394686563145051592141435390537358740558257698705448720389')
  })

  it('computes correct AUM for signature 0xdef789ghi012', () => {
    const result = computeAumFromSignature('0xdef789ghi012')
    expect(result).toBe('2613777770280440317101014524426429261835645894965490760957')
  })

  it('computes correct AUM for empty string signature', () => {
    const result = computeAumFromSignature('')
    expect(result).toBe('661650753212112198971926867105880866744126160826975565909')
  })

  it('computes correct AUM for signature with special characters', () => {
    const result = computeAumFromSignature('0x!@#$%^&*()_+-=[]{}|;:,.<>?')
    expect(result).toBe('1186373806027332396084220085630068469567800647274650496579')
  })

  it('computes correct AUM for signature with unicode characters', () => {
    const result = computeAumFromSignature('0x日本語テスト')
    expect(result).toBe('1544073649788366309167173774853780912850633716633327368877')
  })

  it('returns a value less than 2^191 for long signature', () => {
    const result = computeAumFromSignature('a'.repeat(1000))
    expect(BigInt(result) < TWO_POW_191).toBe(true)
  })

  it('produces deterministic output for same input', () => {
    const result1 = computeAumFromSignature('deterministic-test')
    const result2 = computeAumFromSignature('deterministic-test')
    expect(result1).toBe(result2)
  })

  it('produces different outputs for different signatures', () => {
    const result1 = computeAumFromSignature('signature-a')
    const result2 = computeAumFromSignature('signature-b')
    expect(result1).not.toBe(result2)
  })
})
