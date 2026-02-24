import { hexToDecimalString } from '../../src/transport/round'

describe('hexToDecimalString', () => {
  it('converts zero hex to "0"', () => {
    const result = hexToDecimalString('0x0')
    expect(result).toBe('0')
  })

  it('converts 64-character padded zero to "0"', () => {
    const result = hexToDecimalString(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    )
    expect(result).toBe('0')
  })

  it('converts 1e18 hex to decimal string', () => {
    const result = hexToDecimalString(
      '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
    )
    expect(result).toBe('1000000000000000000')
  })

  it('converts small hex value to decimal string', () => {
    const result = hexToDecimalString('0x1')
    expect(result).toBe('1')
  })

  it('converts hex without leading zeros', () => {
    const result = hexToDecimalString('0xff')
    expect(result).toBe('255')
  })

  it('converts large uint256 value', () => {
    const result = hexToDecimalString(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    )
    expect(result).toBe(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    )
  })

  it('converts mid-range value correctly', () => {
    const result = hexToDecimalString('0x64')
    expect(result).toBe('100')
  })
})
