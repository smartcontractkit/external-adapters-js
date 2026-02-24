import {
  buildMarketResult,
  calculateMidPrice,
  convertResultToFlag,
  convertStatusToCode,
  MarketData,
  parseTimestamp,
} from '../../src/transport/market'

describe('convertStatusToCode', () => {
  it('returns 0 for active status', () => {
    expect(convertStatusToCode('active')).toBe(0)
  })

  it('returns 1 for closed status', () => {
    expect(convertStatusToCode('closed')).toBe(1)
  })

  it('returns 2 for settled status', () => {
    expect(convertStatusToCode('settled')).toBe(2)
  })

  it('returns 0 for unknown status', () => {
    expect(convertStatusToCode('unknown')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(convertStatusToCode('')).toBe(0)
  })
})

describe('convertResultToFlag', () => {
  it('returns 0 for null result', () => {
    expect(convertResultToFlag(null)).toBe(0)
  })

  it('returns 1 for yes result', () => {
    expect(convertResultToFlag('yes')).toBe(1)
  })

  it('returns 2 for no result', () => {
    expect(convertResultToFlag('no')).toBe(2)
  })

  it('returns 0 for unknown result string', () => {
    expect(convertResultToFlag('maybe')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(convertResultToFlag('')).toBe(0)
  })
})

describe('parseTimestamp', () => {
  it('converts ISO string to Unix timestamp in seconds', () => {
    const isoString = '2025-03-19T18:00:00Z'
    const expected = Math.floor(new Date(isoString).getTime() / 1000)
    expect(parseTimestamp(isoString)).toBe(expected)
  })

  it('handles ISO string with milliseconds', () => {
    const isoString = '2024-12-31T23:59:59.999Z'
    const expected = Math.floor(new Date(isoString).getTime() / 1000)
    expect(parseTimestamp(isoString)).toBe(expected)
  })

  it('returns timestamp for epoch date', () => {
    const isoString = '1970-01-01T00:00:00Z'
    expect(parseTimestamp(isoString)).toBe(0)
  })
})

describe('calculateMidPrice', () => {
  it('calculates mid price correctly for equal bid and ask', () => {
    expect(calculateMidPrice(50, 50)).toBe(50)
  })

  it('calculates mid price correctly for different bid and ask', () => {
    expect(calculateMidPrice(48, 52)).toBe(50)
  })

  it('handles zero values', () => {
    expect(calculateMidPrice(0, 0)).toBe(0)
  })

  it('handles decimal values', () => {
    expect(calculateMidPrice(45.5, 54.5)).toBe(50)
  })

  it('handles large values', () => {
    expect(calculateMidPrice(1000000, 2000000)).toBe(1500000)
  })
})

describe('buildMarketResult', () => {
  const mockMarketData: MarketData = {
    can_close_early: true,
    category: 'Macro',
    close_time: '2025-03-19T18:00:00Z',
    event_ticker: 'USIRATECUTS25',
    expiration_time: '2025-03-19T18:00:00Z',
    last_price: 50,
    liquidity: 1000000,
    market_type: 'binary',
    no_ask: 52,
    no_bid: 48,
    open_interest: 104923,
    status: 'active',
    ticker: 'KXUSIRATECUTS25MAR',
    yes_ask: 52,
    yes_bid: 48,
    result: null,
  }

  const fixedUpdatedAt = 1700000000

  it('correctly maps market_ticker from ticker', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.market_ticker).toBe('KXUSIRATECUTS25MAR')
  })

  it('correctly maps event_ticker', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.event_ticker).toBe('USIRATECUTS25')
  })

  it('converts status to market_status code', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.market_status).toBe(0) // active = 0
  })

  it('converts null result to settlement_flag 0', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.settlement_flag).toBe(0)
  })

  it('maps yes_bid_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.yes_bid_price).toBe(48)
  })

  it('maps yes_ask_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.yes_ask_price).toBe(52)
  })

  it('maps no_bid_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.no_bid_price).toBe(48)
  })

  it('maps no_ask_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.no_ask_price).toBe(52)
  })

  it('calculates yes_mid_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.yes_mid_price).toBe(50) // (48 + 52) / 2
  })

  it('calculates no_mid_price correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.no_mid_price).toBe(50) // (48 + 52) / 2
  })

  it('maps open_interest correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.open_interest).toBe(104923)
  })

  it('maps category correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.category).toBe('Macro')
  })

  it('parses close_timestamp correctly', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    const expectedTimestamp = Math.floor(new Date('2025-03-19T18:00:00Z').getTime() / 1000)
    expect(result.close_timestamp).toBe(expectedTimestamp)
  })

  it('uses provided updated_at value', () => {
    const result = buildMarketResult(mockMarketData, fixedUpdatedAt)
    expect(result.updated_at).toBe(1700000000)
  })

  it('handles closed market with yes result', () => {
    const closedMarket: MarketData = {
      ...mockMarketData,
      status: 'closed',
      result: 'yes',
    }
    const result = buildMarketResult(closedMarket, fixedUpdatedAt)
    expect(result.market_status).toBe(1) // closed = 1
    expect(result.settlement_flag).toBe(1) // yes = 1
  })

  it('handles settled market with no result', () => {
    const settledMarket: MarketData = {
      ...mockMarketData,
      status: 'settled',
      result: 'no',
    }
    const result = buildMarketResult(settledMarket, fixedUpdatedAt)
    expect(result.market_status).toBe(2) // settled = 2
    expect(result.settlement_flag).toBe(2) // no = 2
  })

  it('handles zero price values', () => {
    const zeroMarket: MarketData = {
      ...mockMarketData,
      yes_bid: 0,
      yes_ask: 0,
      no_bid: 0,
      no_ask: 0,
    }
    const result = buildMarketResult(zeroMarket, fixedUpdatedAt)
    expect(result.yes_mid_price).toBe(0)
    expect(result.no_mid_price).toBe(0)
  })
})
