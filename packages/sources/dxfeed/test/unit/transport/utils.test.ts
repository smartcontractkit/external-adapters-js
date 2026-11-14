import { eventTimeOf } from '../../../src/transport/dxlink'
import { toNumber } from '../../../src/transport/utils'

describe('transport numeric helpers', () => {
  it('returns null for absent, non-numeric and non-finite values', () => {
    const invalid = [
      null,
      undefined,
      '',
      ' ',
      'NaN',
      'Infinity',
      '0',
      true,
      false,
      {},
      [],
      NaN,
      Infinity,
    ]
    invalid.forEach((value) => expect(toNumber(value)).toBeNull())
  })

  it('returns finite numbers, including zero and negatives', () => {
    const valid = [0, 1.5, -2]
    valid.forEach((value) => expect(toNumber(value)).toBe(value))
  })

  it('prefers the live-verified time field and tolerates eventTime', () => {
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', time: 5, eventTime: 10 })).toBe(5)
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', eventTime: 10 })).toBe(10)
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', time: NaN })).toBeNull()
  })
})
