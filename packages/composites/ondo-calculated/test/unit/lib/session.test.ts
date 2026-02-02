import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateSecondsFromTransition } from '../../../src/lib/session/session'

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
      expect(result).toBe(1800)
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
      expect(result).toBe(-1800)
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
      expect(result).toBe(1800)
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
      expect(result).toBe(Number.MAX_SAFE_INTEGER)
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
      expect(result).toBe(-27000)
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
      expect(result).toBe(-5400)
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
      expect(result).toBe(1800)
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
      expect(result).toBe(5.5)
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

      expect(result).toBe(0)
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

      expect(result).toBe(-240)
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

      expect(result).toBe(240)
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
      expect(result).toBe(1800)
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
      expect(result).toBe(14700)
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
      expect(result).toBe(300)
    })
  })
})
