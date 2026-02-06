import { parseHexOrDecToBigInt } from '../../src/utils/reduce'

describe('parseHexOrDecToBigInt', () => {
  it('should parse valid hex strings to BigInt', () => {
    expect(parseHexOrDecToBigInt('0x0')).toBe(BigInt(0))
    expect(parseHexOrDecToBigInt('0x1')).toBe(BigInt(1))
    expect(parseHexOrDecToBigInt('0xabcdef')).toBe(BigInt('0xabcdef'))
    expect(parseHexOrDecToBigInt('0x1234567890')).toBe(BigInt('0x1234567890'))
  })

  it('should parse valid decimal strings to BigInt', () => {
    expect(parseHexOrDecToBigInt('0')).toBe(BigInt(0))
    expect(parseHexOrDecToBigInt('1')).toBe(BigInt(1))
    expect(parseHexOrDecToBigInt('654321')).toBe(BigInt('654321'))
    expect(parseHexOrDecToBigInt('1234567890')).toBe(BigInt('1234567890'))
  })

  it('should throw error for non-string inputs', () => {
    expect(() => parseHexOrDecToBigInt(123 as any)).toThrow(
      'Expected a hex or decimal string, but received type: number',
    )
    expect(() => parseHexOrDecToBigInt(true as any)).toThrow(
      'Expected a hex or decimal string, but received type: boolean',
    )
    expect(() => parseHexOrDecToBigInt(undefined as any)).toThrow(
      'Expected a hex or decimal string, but received type: undefined',
    )
  })

  it('should throw error for invalid hex or decimal strings', () => {
    expect(() => parseHexOrDecToBigInt('01234')).toThrow('Invalid hex or decimal string: 01234')
    expect(() => parseHexOrDecToBigInt('0xGHIJK')).toThrow('Invalid hex or decimal string: 0xGHIJK')
    expect(() => parseHexOrDecToBigInt('xyz')).toThrow('Invalid hex or decimal string: xyz')
  })

  it('should parse large hex values correctly', () => {
    const largeHex = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // 256-bit max value
    const bigIntResult = parseHexOrDecToBigInt(largeHex)
    expect(bigIntResult.toString()).toBe(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    )
  })

  it('should parse large decimal values correctly', () => {
    const largeHex =
      '115792089237316195423570985008687907853269984665640564039457584007913129639935' // 256-bit max value
    const bigIntResult = parseHexOrDecToBigInt(largeHex)
    expect(bigIntResult.toString()).toBe(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    )
  })
})
