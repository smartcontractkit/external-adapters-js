import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { calculateSecondsFromTransition } from '../../../src/lib/session/session'
import { getSessions } from '../../../src/lib/session/tradingHoursSession'

describe('calculateSecondsFromTransition', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    LoggerFactoryProvider.set()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('tradingHoursSession', () => {
    it('includes PRE_MARKET session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: {
              data: {
                result: [
                  {
                    status: TwentyfourFiveMarketStatus.PRE_MARKET,
                    statusString: 'PRE_MARKET',
                    time: '2024-01-15T10:00:00.000Z',
                  },
                ],
              },
              statusCode: 200,
            },
          },
        }),
      } as unknown as Requester

      const result = await calculateSecondsFromTransition(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        '24/5',
      )

      // 10:30 is 30 minutes (1800s) after PRE_MARKET at 10:00
      expect(result).toEqual({ value: 1800, source: 'TRADINGHOURS' })
    })

    it('includes POST_MARKET session', async () => {
      jest.setSystemTime(new Date('2024-01-15T15:30:00Z').getTime())

      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: {
              data: {
                result: [
                  {
                    status: TwentyfourFiveMarketStatus.POST_MARKET,
                    statusString: 'POST_MARKET',
                    time: '2024-01-15T16:00:00.000Z',
                  },
                ],
              },
              statusCode: 200,
            },
          },
        }),
      } as unknown as Requester

      const result = await calculateSecondsFromTransition(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        '24/5',
      )

      // 15:30 is 30 minutes (1800s) before POST_MARKET at 16:00
      expect(result).toEqual({ value: -1800, source: 'TRADINGHOURS' })
    })

    it('includes OVERNIGHT session', async () => {
      jest.setSystemTime(new Date('2024-01-15T04:30:00Z').getTime())

      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: {
              data: {
                result: [
                  {
                    status: TwentyfourFiveMarketStatus.OVERNIGHT,
                    statusString: 'OVERNIGHT',
                    time: '2024-01-15T04:00:00.000Z',
                  },
                ],
              },
              statusCode: 200,
            },
          },
        }),
      } as unknown as Requester

      const result = await calculateSecondsFromTransition(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        '24/5',
      )

      // 04:30 is 30 minutes (1800s) after OVERNIGHT at 04:00
      expect(result).toEqual({ value: 1800, source: 'TRADINGHOURS' })
    })

    it('filters out UNKNOWN status', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: {
              data: {
                result: [
                  {
                    status: TwentyfourFiveMarketStatus.UNKNOWN,
                    statusString: 'UNKNOWN',
                    time: '2024-01-15T12:00:00.000Z',
                  },
                ],
              },
              statusCode: 200,
            },
          },
        }),
      } as unknown as Requester

      const result = await calculateSecondsFromTransition(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        '24/5',
      )

      // no sessions from trading hours
      expect(result).toEqual({ value: Number.MAX_SAFE_INTEGER, source: 'TRADINGHOURS' })
    })

    it('skips Sunday overnight session', async () => {
      // Sunday 20:30 UTC
      jest.setSystemTime(new Date('2024-01-07T20:30:00Z').getTime())

      const requester = {
        request: jest.fn().mockResolvedValue({
          response: {
            data: {
              data: {
                result: [
                  {
                    status: TwentyfourFiveMarketStatus.OVERNIGHT,
                    statusString: 'OVERNIGHT',
                    time: '2024-01-07T20:00:00.000Z',
                  },
                  {
                    status: TwentyfourFiveMarketStatus.PRE_MARKET,
                    statusString: 'PRE_MARKET',
                    time: '2024-01-08T04:00:00.000Z',
                  },
                ],
              },
              statusCode: 200,
            },
          },
        }),
      } as unknown as Requester

      const result = await calculateSecondsFromTransition(
        'https://tradinghours.example.com',
        requester,
        [],
        'UTC',
        'nyse',
        '24/5',
      )

      // 20:30 Sun → 04:00 Mon = -27000s
      expect(result).toEqual({ value: -27000, source: 'TRADINGHOURS' })
    })
  })

  describe('fallback - tradingHoursSession error', () => {
    const failingRequester = {
      request: jest.fn().mockRejectedValue(new Error('TradingHours EA unavailable')),
    } as unknown as Requester

    it('before session', async () => {
      jest.setSystemTime(new Date('2024-01-15T12:30:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['10:00', '14:00', '16:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      // 12:30 is 90 minutes (5400 seconds) before 14:00
      expect(result).toEqual({ value: -5400, source: 'FALLBACK' })
    })

    it('after session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['10:00', '14:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      // 10:30 is 30 minutes (1800 seconds) after 10:00
      expect(result).toEqual({ value: 1800, source: 'FALLBACK' })
    })

    it('close to session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:05.5Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['10:00', '14:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      // 10:00:05.5 is 5.5 seconds after 10:00
      expect(result).toEqual({ value: 5.5, source: 'FALLBACK' })
    })

    it('at session', async () => {
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['10:00', '14:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      expect(result).toEqual({ value: 0, source: 'FALLBACK' })
    })

    it('mid night - before', async () => {
      jest.setSystemTime(new Date('2024-01-15T23:58:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['00:02'],
        'UTC',
        'nyse',
        '24/5',
      )

      expect(result).toEqual({ value: -240, source: 'FALLBACK' })
    })

    it('mid night - after', async () => {
      jest.setSystemTime(new Date('2024-01-15T00:02:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['23:58'],
        'UTC',
        'nyse',
        '24/5',
      )

      expect(result).toEqual({ value: 240, source: 'FALLBACK' })
    })

    it('timezone conversions', async () => {
      jest.setSystemTime(new Date('2024-01-15T09:30:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['10:00'],
        'Europe/Paris',
        'nyse',
        '24/5',
      )

      // 09:30 UTC -> 10:30 Paris is 30 minutes after 10:00
      expect(result).toEqual({ value: 1800, source: 'FALLBACK' })
    })

    it('skips Sunday 8PM', async () => {
      // Sunday 8:05 PM UTC
      jest.setSystemTime(new Date('2024-01-07T20:05:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['04:00', '16:00', '20:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      // Sunday 8:05 PM is 4 hours and 5 minutes (14700 seconds) after Sunday 4PM
      expect(result).toEqual({ value: 14700, source: 'FALLBACK' })
    })

    it('does not skip non-Sunday 8PM', async () => {
      // Friday 8:05 PM UTC
      jest.setSystemTime(new Date('2024-01-05T20:05:00Z').getTime())

      const result = await calculateSecondsFromTransition(
        '',
        failingRequester,
        ['04:00', '16:00', '20:00'],
        'UTC',
        'nyse',
        '24/5',
      )

      // Unlike Sunday 8PM, Friday 8PM should not be skipped
      expect(result).toEqual({ value: 300, source: 'FALLBACK' })
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
})
