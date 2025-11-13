jest.mock('@chainlink/external-adapter-framework/validation/market-status', () => {
  return {
    isWeekendNow: jest.fn(),
  }
})

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  ...jest.requireActual('@chainlink/external-adapter-framework/util'),
  makeLogger: jest.fn(() => ({ warn: jest.fn() })),
}))

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

    it('return OPEN when status is Open', () => {
      expect(parseMarketStatus(param, 'Open')).toStrictEqual({
        status: MarketStatus.OPEN,
        string: 'OPEN',
      })
    })

    it('return CLOSED when status is Closed', () => {
      expect(parseMarketStatus(param, 'Closed')).toStrictEqual({
        status: MarketStatus.CLOSED,
        string: 'CLOSED',
      })
    })

    it('return UNKNOWN when status is empty or random string', () => {
      expect(parseMarketStatus(param, '')).toStrictEqual({
        status: MarketStatus.UNKNOWN,
        string: 'UNKNOWN',
      })

      expect(parseMarketStatus(param, 'random')).toStrictEqual({
        status: MarketStatus.UNKNOWN,
        string: 'UNKNOWN',
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
      expect(parseMarketStatus(baseParam, '', '')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.WEEKEND,
        string: 'WEEKEND',
      })
    })

    it('return REGULAR - open', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(parseMarketStatus(baseParam, 'Open', 'Primary Trading Session/A')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.REGULAR,
        string: 'REGULAR',
      })
    })

    it('return UNKNOWN - open', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(parseMarketStatus(baseParam, 'Open', 'random')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.UNKNOWN,
        string: 'UNKNOWN',
      })
    })

    it('return PRE_MARKET', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, 'Closed', 'Columbus Day - Pre-Trading Session'),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.PRE_MARKET,
        string: 'PRE_MARKET',
      })
    })

    it('return POST_MARKET', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(
        parseMarketStatus(baseParam, 'Closed', 'Columbus Day - Post-Trading Session'),
      ).toStrictEqual({
        status: TwentyfourFiveMarketStatus.POST_MARKET,
        string: 'POST_MARKET',
      })
    })

    it('return OVERNIGHT - contains day', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(parseMarketStatus(baseParam, 'Closed', 'Veterans Day')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        string: 'OVERNIGHT',
      })
    })

    it('return OVERNIGHT - null', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(parseMarketStatus(baseParam, 'Closed', '')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.OVERNIGHT,
        string: 'OVERNIGHT',
      })
    })

    it('return UNKNOWN - Closed', () => {
      ;(isWeekendNow as jest.Mock).mockReturnValue(false)
      expect(parseMarketStatus(baseParam, 'Closed', 'random')).toStrictEqual({
        status: TwentyfourFiveMarketStatus.UNKNOWN,
        string: 'UNKNOWN',
      })
    })
  })
})
