import { latestUpdateIsWithinLast24h, tenorInRange } from '../../src/transport/utils'
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
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(currentDayTimestampMs)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns false when the input timestamp is not valid', () => {
    const invalidTimestamp = NaN
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(invalidTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })

  it('returns true when the latest update is on the first millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayFirstMsTimestamp = new Date(`${currentDayIsoString}T00:00:00.000Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(currentDayFirstMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns true when the latest update is on the last millisecond of the current day in UTC time zone', () => {
    const currentDayIsoString = new Date().toISOString().substring(0, 10)
    const currentDayLastMsTimestamp = new Date(`${currentDayIsoString}T23:59:59.999Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(currentDayLastMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns true when within 24 hours + 30 mins of latest update', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-08-31T15:29:59.999Z'))
    const yesterdayLastMsTimestamp = new Date(`2023-08-30T15:00:00.000Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(yesterdayLastMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(true)
  })

  it('returns false when past of 24 hours + 30 mins of latest update', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-08-31T15:30:00.000Z'))
    const yesterdayLastMsTimestamp = new Date(`2023-08-30T15:00:00.000Z`).getTime()
    const latestUpdateIsCurrentDayResult = latestUpdateIsWithinLast24h(yesterdayLastMsTimestamp)
    expect(latestUpdateIsCurrentDayResult).toBe(false)
  })
})
