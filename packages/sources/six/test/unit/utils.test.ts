import { buildCloseStreamQuery, buildSubscriptionQuery } from '../../src/transport/utils'

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
