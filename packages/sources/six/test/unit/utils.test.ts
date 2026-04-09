import {
  buildCloseStreamQuery,
  buildSubscriptionQuery,
  mapMarketBaseStatusToV11,
  MARKET_STATUS_CLOSED,
  MARKET_STATUS_OPEN,
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

describe('mapMarketBaseStatusToV11', () => {
  it('maps ACTIVE to open (2)', () => {
    expect(mapMarketBaseStatusToV11('ACTIVE')).toBe(MARKET_STATUS_OPEN)
  })

  it('maps INACTIVE to closed (4)', () => {
    expect(mapMarketBaseStatusToV11('INACTIVE')).toBe(MARKET_STATUS_CLOSED)
  })

  it('maps REFERENCE_ONLY to unknown (0)', () => {
    expect(mapMarketBaseStatusToV11('REFERENCE_ONLY')).toBe(MARKET_STATUS_UNKNOWN)
  })

  it('maps OTHER to unknown (0)', () => {
    expect(mapMarketBaseStatusToV11('OTHER')).toBe(MARKET_STATUS_UNKNOWN)
  })

  it('is case-insensitive', () => {
    expect(mapMarketBaseStatusToV11('active')).toBe(MARKET_STATUS_OPEN)
    expect(mapMarketBaseStatusToV11('Inactive')).toBe(MARKET_STATUS_CLOSED)
  })

  it('returns unknown (0) for undefined', () => {
    expect(mapMarketBaseStatusToV11(undefined)).toBe(MARKET_STATUS_UNKNOWN)
  })

  it('returns unknown (0) for unrecognized statuses', () => {
    expect(mapMarketBaseStatusToV11('SOMETHING_ELSE')).toBe(MARKET_STATUS_UNKNOWN)
    expect(mapMarketBaseStatusToV11('')).toBe(MARKET_STATUS_UNKNOWN)
  })
})
