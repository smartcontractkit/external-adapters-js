import {
  buildCloseStreamQuery,
  buildSubscriptionQuery,
  mapTradingEventToMarketStatus,
  MARKET_STATUS_CLOSED,
  MARKET_STATUS_OPEN,
  MARKET_STATUS_POST_MARKET,
  MARKET_STATUS_PRE_MARKET,
  MARKET_STATUS_UNKNOWN,
} from '../../src/transport/utils'

describe('buildSubscriptionQuery', () => {
  it('builds a valid GraphQL subscription with conflation', () => {
    const query = buildSubscriptionQuery('ABBN', '4', 'PT1S')
    expect(query).toContain('startStream')
    expect(query).toContain('TICKER_BC')
    expect(query).toContain('"ABBN_4"')
    expect(query).toContain('streamId: "ABBN_4"')
    expect(query).toContain('conflationType: INTERVAL')
    expect(query).toContain('conflationPeriod: "PT1S"')
    expect(query).toContain('last { value size unixTimestamp }')
    expect(query).toContain('bestBid { value size unixTimestamp }')
    expect(query).toContain('bestAsk { value size unixTimestamp }')
    expect(query).toContain('mid { value unixTimestamp }')
    expect(query).toContain('volume { value unixTimestamp }')
  })

  it('uses the provided conflation period', () => {
    const query = buildSubscriptionQuery('ANA', '1058', 'PT0.5S')
    expect(query).toContain('"ANA_1058"')
    expect(query).toContain('conflationPeriod: "PT0.5S"')
  })
})

describe('buildCloseStreamQuery', () => {
  it('builds a valid closeStream mutation', () => {
    const query = buildCloseStreamQuery('ABBN', '4')
    expect(query).toContain('closeStream')
    expect(query).toContain('streamId: "ABBN_4"')
    expect(query).toContain('type')
    expect(query).toContain('streamId')
  })
})

describe('buildSubscriptionQuery (tradingEvent)', () => {
  it('includes tradingEvent in the subscription', () => {
    const query = buildSubscriptionQuery('ABBN', '4', 'PT1S')
    expect(query).toContain('tradingEvent { category unixTimestamp }')
  })
})

describe('mapTradingEventToMarketStatus', () => {
  it('maps OPEN_MARKET to open (2)', () => {
    expect(mapTradingEventToMarketStatus('OPEN_MARKET')).toBe(MARKET_STATUS_OPEN)
  })

  it('maps CONTINUOUS_TRADING to open (2)', () => {
    expect(mapTradingEventToMarketStatus('CONTINUOUS_TRADING')).toBe(MARKET_STATUS_OPEN)
  })

  it('maps CLOSED_MARKET to closed (4)', () => {
    expect(mapTradingEventToMarketStatus('CLOSED_MARKET')).toBe(MARKET_STATUS_CLOSED)
  })

  it('maps PRE_OPEN to pre-market (1)', () => {
    expect(mapTradingEventToMarketStatus('PRE_OPEN')).toBe(MARKET_STATUS_PRE_MARKET)
  })

  it('maps OPENING_AUCTION to pre-market (1)', () => {
    expect(mapTradingEventToMarketStatus('OPENING_AUCTION')).toBe(MARKET_STATUS_PRE_MARKET)
  })

  it('maps CLOSING_AUCTION to post-market (3)', () => {
    expect(mapTradingEventToMarketStatus('CLOSING_AUCTION')).toBe(MARKET_STATUS_POST_MARKET)
  })

  it('maps POST_TRADING to post-market (3)', () => {
    expect(mapTradingEventToMarketStatus('POST_TRADING')).toBe(MARKET_STATUS_POST_MARKET)
  })

  it('is case-insensitive', () => {
    expect(mapTradingEventToMarketStatus('open_market')).toBe(MARKET_STATUS_OPEN)
    expect(mapTradingEventToMarketStatus('Closed_Market')).toBe(MARKET_STATUS_CLOSED)
  })

  it('returns unknown (0) for undefined', () => {
    expect(mapTradingEventToMarketStatus(undefined)).toBe(MARKET_STATUS_UNKNOWN)
  })

  it('returns unknown (0) for unrecognized categories', () => {
    expect(mapTradingEventToMarketStatus('SOMETHING_ELSE')).toBe(MARKET_STATUS_UNKNOWN)
    expect(mapTradingEventToMarketStatus('')).toBe(MARKET_STATUS_UNKNOWN)
  })
})
