import {
  checkRipcord,
  parseDateMs,
  parseNumber,
  parseTimestampMs,
  ProviderDataError,
} from '../../src/transport/utils'

describe('parseNumber', () => {
  it.each(['1', '1.000000', '5400000.00', '-1.5'])('accepts %s', (value) => {
    expect(parseNumber(value, 'value')).toBe(Number(value))
  })

  it.each(['', ' ', '0x10', '1e3', '1.2.3', 'nope'])('rejects %s', (value) => {
    expect(() => parseNumber(value, 'value')).toThrow(ProviderDataError)
  })

  it('rejects non-string and non-finite values', () => {
    expect(() => parseNumber(5, 'value')).toThrow(ProviderDataError)
    expect(() => parseNumber(null, 'value')).toThrow(ProviderDataError)
    expect(() => parseNumber('9'.repeat(400), 'value')).toThrow(ProviderDataError)
  })
})

describe('parseDateMs', () => {
  it.each(['2026-10-13', '2024-02-29'])('accepts %s', (value) => {
    expect(parseDateMs(value)).toBe(
      Date.UTC(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        Number(value.slice(8, 10)),
      ),
    )
  })

  it.each([
    '2026-02-30',
    '2026-W41-1',
    '0099-01-01',
    '1969-12-31',
    '2026-10-13T00:00:00Z',
    'not-a-date',
  ])('rejects %s', (value) => {
    expect(() => parseDateMs(value)).toThrow(ProviderDataError)
  })

  it('rejects non-string values', () => {
    expect(() => parseDateMs(null)).toThrow(ProviderDataError)
  })
})

describe('parseTimestampMs', () => {
  it.each([
    '2026-10-13T00:05:00.000Z',
    '2026-10-13T00:05:00.0Z',
    '2026-10-13T00:05:00.00Z',
    '2026-10-13T00:05:00.123Z',
    '2026-10-13T00:05:00Z',
  ])('accepts %s', (value) => {
    expect(parseTimestampMs(value)).toBeGreaterThan(0)
  })

  it.each([
    '2026-10-13T00:05:00.Z',
    '2026-10-13T00:05:00.0000Z',
    '2026-10-13T00:05:00+00:00',
    '10/13/2026',
    '2026-10-13 00:05:00Z',
    '2026-10-13t00:05:00z',
    '2026-10-13T00:05:00.000Zx',
    '1969-12-31T00:00:00.000Z',
  ])('rejects %s', (value) => {
    expect(() => parseTimestampMs(value)).toThrow(ProviderDataError)
  })

  it('rejects non-string values', () => {
    expect(() => parseTimestampMs(null)).toThrow(ProviderDataError)
  })
})

describe('checkRipcord', () => {
  it('returns the false ripcord state', () => {
    expect(checkRipcord({ ripcord: false, ripcordDetails: [] })).toEqual({
      ripcord: false,
      ripcordAsInt: 0,
    })
  })

  it('throws on ripcord true with details', () => {
    expect(() => checkRipcord({ ripcord: true, ripcordDetails: ['a', 'b'] })).toThrow(
      'Ripcord indicator true. Details: a, b',
    )
  })

  it.each([
    [{ ripcord: true }, 'Ripcord indicator true'],
    [{}, 'ripcord is not a valid value'],
    [{ ripcord: 'false' }, 'ripcord is not a valid value'],
    [{ ripcord: true, ripcordDetails: 'oops' }, 'ripcordDetails is not a valid value'],
  ])('throws on invalid ripcord data %#', (data, message) => {
    expect(() => checkRipcord(data)).toThrow(message)
  })
})
