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

  it('prefers eventTime and tolerates the legacy time field', () => {
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', eventTime: 10, time: 5 })).toBe(
      10,
    )
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', time: 5 })).toBe(5)
    expect(eventTimeOf({ eventType: 'Quote', eventSymbol: 'AAPL', eventTime: NaN })).toBeNull()
  })
})
