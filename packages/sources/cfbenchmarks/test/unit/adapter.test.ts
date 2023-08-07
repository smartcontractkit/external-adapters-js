import { latestUpdateIsCurrentDay, tenorInRange } from '../../src/transport/utils'
import { getIdFromBaseQuote } from '../../src/endpoint/utils'

describe('getIdFromBaseQuote', () => {
  const tests: {
    name: string
    input: { data: { base: string; quote: string } }
    output: string
    useSecondary: boolean
  }[] = [
    {
      name: 'uses base/quote if present',
      input: { data: { base: 'ETH', quote: 'USD' } },
      output: 'ETHUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'uses aliases base/quote if present',
      input: { data: { base: 'USDT', quote: 'USD' } },
      output: 'USDTUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps BTC/USD quote BRTI',
      input: { data: { base: 'BTC', quote: 'USD' } },
      output: 'BRTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote SOLUSD_RTI if not using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'SOLUSD_RTI',
      useSecondary: false,
    },
    {
      name: 'maps SOL/USD quote U_SOLUSD_RTI if using secondary endpoint',
      input: { data: { base: 'SOL', quote: 'USD' } },
      output: 'U_SOLUSD_RTI',
      useSecondary: true,
    },
  ]

  tests.forEach((test) => {
    it(`${test.name}`, async () => {
      const type = test.useSecondary ? 'secondary' : 'primary'
      expect(getIdFromBaseQuote(test.input.data.base, test.input.data.quote, type)).toEqual(
        test.output,
      )
    })
  })
})

describe('tenorInRange', () => {
  test('should return true when tenor is within range', () => {
    expect(tenorInRange(0)).toBe(true)
    expect(tenorInRange(-1)).toBe(true)
    expect(tenorInRange(1)).toBe(true)
    expect(tenorInRange(0.755)).toBe(true)
  })

  test('should return false when tenor is outside of range', () => {
    expect(tenorInRange(-1.1)).toBe(false)
    expect(tenorInRange(1.1)).toBe(false)
    expect(tenorInRange(2)).toBe(false)
    expect(tenorInRange(-2)).toBe(false)
  })
})

describe('latestUpdateIsCurrentDay', () => {
  it('returns true when the latest update is on the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString()
    const currentDayTimestampMs = new Date(currentDayIsoString).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayTimestampMs)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns false when the latest update is not on the current day in UTC time zone', () => {
    const yesterdayIsoString = new Date(Date.now() - 86400000).toISOString()
    const yesterdayTimestampMs = new Date(yesterdayIsoString).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(yesterdayTimestampMs)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })

  it('returns false when the input timestamp is not valid', () => {
    const invalidTimestamp = NaN
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(invalidTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })

  it('returns true when the latest update is on the first millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayFirstMsTimestamp = new Date(`${currentDayIsoString}T00:00:00.000Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayFirstMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns true when the latest update is on the last millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayLastMsTimestamp = new Date(`${currentDayIsoString}T23:59:59.999Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsCurrentDay(currentDayLastMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })
})
