import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getSessionContext } from '../../../src/lib/session/session'
import { getMarketStatus, getSessions } from '../../../src/lib/session/tradingHoursSession'

const event = (status: TwentyfourFiveMarketStatus, time: string) => ({
  status,
  statusString: TwentyfourFiveMarketStatus[status],
  time,
})

const makeRequester = (
  sessionResult: unknown,
  statusResult: unknown = TwentyfourFiveMarketStatus.PRE_MARKET,
) => {
  const request = jest.fn((_body: string, config: { data: { data: { endpoint: string } } }) => {
    const endpoint = config.data.data.endpoint
    const value = endpoint === 'market-session' ? sessionResult : statusResult
    if (value instanceof Error) {
      return Promise.reject(value)
    }
    return Promise.resolve({
      response: {
        data: {
          data: { result: value },
          statusCode: 200,
        },
      },
    })
  })

  return { requester: { request } as unknown as Requester, request }
}

const sessionContext = async (
  sessionResult: unknown,
  statusResult?: unknown,
  boundaries: string[] = [],
  timeZone = 'UTC',
) => {
  const { requester } = makeRequester(sessionResult, statusResult)
  return getSessionContext(
    'https://tradinghours.example.com',
    requester,
    boundaries,
    timeZone,
    'nyse',
    '24/5',
  )
}

describe('getSessionContext', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    LoggerFactoryProvider.set()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('tradinghours schedule', () => {
    it('includes PRE_MARKET session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T10:00:00.000Z')],
        TwentyfourFiveMarketStatus.PRE_MARKET,
      )

      // 10:30 is 30 minutes (1800s) after PRE_MARKET at 10:00
      expect(result).toMatchObject({
        secondsFromTransition: 1800,
        source: 'TRADINGHOURS',
        expectedStatus: TwentyfourFiveMarketStatus.PRE_MARKET,
      })
    })

    it('includes POST_MARKET session', async () => {
      jest.setSystemTime(new Date('2024-01-15T15:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.POST_MARKET, '2024-01-15T16:00:00.000Z')],
        TwentyfourFiveMarketStatus.POST_MARKET,
      )

      // 15:30 is 30 minutes (1800s) before POST_MARKET at 16:00
      expect(result).toMatchObject({
        secondsFromTransition: -1800,
        source: 'TRADINGHOURS',
        expectedStatus: TwentyfourFiveMarketStatus.POST_MARKET,
      })
    })

    it('includes OVERNIGHT session', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-15T04:00:00.000Z')],
        TwentyfourFiveMarketStatus.OVERNIGHT,
      )

      // 04:30 is 30 minutes (1800s) after OVERNIGHT at 04:00
      expect(result).toMatchObject({
        secondsFromTransition: 1800,
        source: 'TRADINGHOURS',
        expectedStatus: TwentyfourFiveMarketStatus.OVERNIGHT,
      })
    })

    it('keeps REGULAR in the schedule but excludes it from smoothing', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.REGULAR, '2024-01-15T10:00:00.000Z')],
        TwentyfourFiveMarketStatus.REGULAR,
      )

      expect(result?.events).toHaveLength(1)
      expect(result?.expectedStatus).toBe(TwentyfourFiveMarketStatus.REGULAR)
      expect(result?.secondsFromTransition).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('filters out UNKNOWN status', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.UNKNOWN, '2024-01-15T12:00:00.000Z')],
        TwentyfourFiveMarketStatus.UNKNOWN,
      )

      expect(result?.events).toEqual([])
      expect(result?.expectedStatus).toBe(TwentyfourFiveMarketStatus.UNKNOWN)
      expect(result?.secondsFromTransition).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('keeps Sunday overnight in the schedule but excludes it from smoothing', async () => {
      // Sunday 20:30 UTC
      jest.setSystemTime(new Date('2024-01-07T20:30:00Z').getTime())

      const result = await sessionContext(
        [
          event(TwentyfourFiveMarketStatus.OVERNIGHT, '2024-01-07T20:00:00.000Z'),
          event(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-08T04:00:00.000Z'),
        ],
        TwentyfourFiveMarketStatus.OVERNIGHT,
      )

      // 20:30 Sun → 04:00 Mon = -27000s
      expect(result?.secondsFromTransition).toBe(-27000)
      expect(result?.events).toHaveLength(2)
    })

    it('falls back to the latest scheduled status when market-status fails', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await sessionContext(
        [event(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T10:00:00.000Z')],
        new Error('market-status unavailable'),
      )

      expect(result?.source).toBe('TRADINGHOURS')
      expect(result?.expectedStatus).toBe(TwentyfourFiveMarketStatus.PRE_MARKET)
    })

    it('does not call market-status for non-24/5 market types', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const { requester, request } = makeRequester([
        event(TwentyfourFiveMarketStatus.PRE_MARKET, '2024-01-15T10:00:00.000Z'),
      ])

      const result = await getSessionContext(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        'regular',
      )

      expect(request).toHaveBeenCalledTimes(1)
      expect(result?.expectedStatus).toBe(TwentyfourFiveMarketStatus.PRE_MARKET)
    })
  })

  describe('fallback - tradingHoursSession error', () => {
    const failingSession = new Error('TradingHours EA unavailable')

    it('before session', async () => {
      jest.setSystemTime(new Date('2024-01-15T12:30:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['10:00', '14:00', '16:00'])

      // 12:30 is 90 minutes (5400 seconds) before 14:00
      expect(result).toMatchObject({ secondsFromTransition: -5400, source: 'FALLBACK' })
      expect(result?.expectedStatus).toBeUndefined()
    })

    it('after session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['10:00', '14:00'])

      // 10:30 is 30 minutes (1800 seconds) after 10:00
      expect(result).toMatchObject({ secondsFromTransition: 1800, source: 'FALLBACK' })
    })

    it('close to session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:05.5Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['10:00', '14:00'])

      // 10:00:05.5 is 5.5 seconds after 10:00
      expect(result).toMatchObject({ secondsFromTransition: 5.5, source: 'FALLBACK' })
    })

    it('at session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['10:00', '14:00'])

      expect(result).toMatchObject({ secondsFromTransition: 0, source: 'FALLBACK' })
    })

    it('mid night - before', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:58:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['00:02'])

      expect(result).toMatchObject({ secondsFromTransition: -240, source: 'FALLBACK' })
    })

    it('mid night - after', async () => {
      jest.setSystemTime(new Date('2024-01-15T00:02:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['23:58'])

      expect(result).toMatchObject({ secondsFromTransition: 240, source: 'FALLBACK' })
    })

    it('timezone conversions', async () => {
      jest.setSystemTime(new Date('2024-01-15T09:30:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['10:00'], 'Europe/Paris')

      // 09:30 UTC -> 10:30 Paris is 30 minutes after 10:00
      expect(result).toMatchObject({ secondsFromTransition: 1800, source: 'FALLBACK' })
    })

    it('skips Sunday 8PM from smoothing but keeps it in the schedule', async () => {
      // Sunday 8:05 PM UTC
      jest.setSystemTime(new Date('2024-01-07T20:05:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['04:00', '16:00', '20:00'])

      // Sunday 8:05 PM is 4 hours and 5 minutes (14700 seconds) after Sunday 4PM
      expect(result).toMatchObject({ secondsFromTransition: 14700, source: 'FALLBACK' })
      expect(result?.events.some((e) => new Date(e.startMs).getUTCHours() === 20)).toBe(true)
    })

    it('does not skip non-Sunday 8PM', async () => {
      // Friday 8:05 PM UTC
      jest.setSystemTime(new Date('2024-01-05T20:05:00Z').getTime())

      const result = await sessionContext(failingSession, undefined, ['04:00', '16:00', '20:00'])

      // Unlike Sunday 8PM, Friday 8PM should not be skipped
      expect(result).toMatchObject({ secondsFromTransition: 300, source: 'FALLBACK' })
    })
  })

  describe('missing session configuration', () => {
    it('returns undefined when the timezone is missing', async () => {
      const { requester } = makeRequester([])

      const result = await getSessionContext('https://tradinghours.example.com', requester, [])

      expect(result).toBeUndefined()
    })
  })

  describe('tradingHoursSession - EA failure message', () => {
    it('sets error message when result is empty', async () => {
      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: { data: {} },
            status: 500,
            statusText: 'Internal Server Error',
          },
        }),
      } as unknown as Requester

      try {
        await getSessions('https://tradinghours.example.com', requester, 'UTC', 'nyse', '24/5')
      } catch (e) {
        expect(e).toBeInstanceOf(AdapterError)
        expect((e as AdapterError).message).toBe(
          'TradingHoursEA request failed: TradingHours EA request failed: {"data":{}} 500 Internal Server Error AdapterError',
        )
      }
    })

    it('sets error message when requester throws AdapterError', async () => {
      const adapterError = new AdapterError({
        message: 'Upstream error',
        errorResponse: { code: 503 },
      })
      const requester = {
        request: jest.fn().mockRejectedValue(adapterError),
      } as unknown as Requester

      try {
        await getSessions('https://tradinghours.example.com', requester, 'UTC', 'nyse', '24/5')
      } catch (e) {
        expect(e).toBeInstanceOf(AdapterError)
        expect((e as AdapterError).message).toBe(
          'TradingHoursEA request failed: Upstream error {"code":503}',
        )
      }
    })

    it('preserves error message when requester throws regular Error', async () => {
      const requester = {
        request: jest.fn().mockRejectedValue(new Error('Connection refused')),
      } as unknown as Requester

      try {
        await getSessions('https://tradinghours.example.com', requester, 'UTC', 'nyse', '24/5')
      } catch (e) {
        expect(e).not.toBeInstanceOf(AdapterError)
        expect((e as Error).message).toBe('Connection refused')
      }
    })
  })

  describe('getMarketStatus', () => {
    it('returns the status from tradinghours', async () => {
      const { requester } = makeRequester([], TwentyfourFiveMarketStatus.WEEKEND)

      const result = await getMarketStatus(
        'https://tradinghours.example.com',
        requester,
        'nyse',
        '24/5',
        '520-020:America/New_York',
      )

      expect(result).toBe(TwentyfourFiveMarketStatus.WEEKEND)
    })

    it('throws when the response has no numeric result', async () => {
      const { requester } = makeRequester([], { unexpected: true })

      await expect(
        getMarketStatus(
          'https://tradinghours.example.com',
          requester,
          'nyse',
          '24/5',
          '520-020:America/New_York',
        ),
      ).rejects.toBeInstanceOf(AdapterError)
    })
  })
})
