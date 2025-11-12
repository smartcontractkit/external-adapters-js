jest.mock('@chainlink/external-adapter-framework/validation/market-status', () => {
  return {
    isWeekendNow: jest.fn(),
  }
})

import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'

import { parseMarketStatus } from '../../src/transport/market-status'

describe('parseMarketStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('type: regular', () => {
    const param = {
      market: 'NYSE',
      type: 'regular' as const,
    }

    it('return UNKNOWN when all data values are null', () => {
      expect(parseMarketStatus(param, {} as any)).toStrictEqual({
        status: MarketStatus.UNKNOWN,
        string: 'UNKNOWN',
      })
    })

    it('return OPEN when session is regular', () => {
      expect(
        parseMarketStatus(param, {
          session: 'regular',
        } as any),
      ).toStrictEqual({
        status: MarketStatus.OPEN,
        string: 'OPEN',
      })
    })

    it('return CLOSED when session is not regular', () => {
      expect(
        parseMarketStatus(param, {
          session: 'pre-market',
        } as any),
      ).toStrictEqual({
        status: MarketStatus.CLOSED,
        string: 'CLOSED',
      })
    })

    it('return CLOSED when session is null', () => {
      expect(
        parseMarketStatus(param, {
          exchange: '123',
          session: null,
        } as any),
      ).toStrictEqual({
        status: MarketStatus.CLOSED,
        string: 'CLOSED',
      })
    })
  })

  describe('type: 24/5', () => {
    const baseParam = {
      market: 'BTC',
      type: '24/5' as const,
      weekend: '520-020:America/New_York',
    }

    it('return WEEKEND when isWeekend returns true', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(true)
      expect(
        parseMarketStatus(baseParam, {
          session: 'regular',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.WEEKEND,
        string: 'WEEKEND',
      })
    })

    it('return OVERNIGHT when session is empty', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, {
          session: '',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        string: 'OVERNIGHT',
      })
    })

    it('return REGULAR when session is regular', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, {
          session: 'regular',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.REGULAR,
        string: 'REGULAR',
      })
    })

    it('return PRE_MARKET when session is pre-market', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, {
          session: 'pre-market',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.PRE_MARKET,
        string: 'PRE_MARKET',
      })
    })

    it('return POST_MARKET when session is post-market', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, {
          session: 'post-market',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.POST_MARKET,
        string: 'POST_MARKET',
      })
    })

    it('return UNKNOWN when session is not in mapping', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, {
          session: 'unknown-session',
        } as any),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.UNKNOWN,
        string: 'UNKNOWN',
      })
    })
  })
})
