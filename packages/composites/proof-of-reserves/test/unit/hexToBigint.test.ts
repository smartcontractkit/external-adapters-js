import { parseHexToBigInt } from '../../src/utils/reduce'

describe('parseHexToBigInt', () => {
  it('should parse valid hex strings to BigInt', () => {
    expect(parseHexToBigInt('0x1')).toBe(BigInt(1))
    expect(parseHexToBigInt('0xabcdef')).toBe(BigInt('0xabcdef'))
    expect(parseHexToBigInt('0x1234567890')).toBe(BigInt('0x1234567890'))
  })

  it('should throw error for non-string inputs', () => {
    expect(() => parseHexToBigInt(123 as any)).toThrow(
      'Expected a hex string, but received type: number',
    )
    expect(() => parseHexToBigInt(true as any)).toThrow(
      'Expected a hex string, but received type: boolean',
    )
    expect(() => parseHexToBigInt(undefined as any)).toThrow(
      'Expected a hex string, but received type: undefined',
    )
  })

  it('should throw error for invalid hex strings', () => {
    expect(() => parseHexToBigInt('1234')).toThrow('Invalid hex string: 1234')
    expect(() => parseHexToBigInt('0xGHIJK')).toThrow('Invalid hex string: 0xGHIJK')
    expect(() => parseHexToBigInt('xyz')).toThrow('Invalid hex string: xyz')
  })

  it('should parse large hex values correctly', () => {
    const largeHex = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // 256-bit max value
    const bigIntResult = parseHexToBigInt(largeHex)
    expect(bigIntResult.toString()).toBe(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    )
  })
})
