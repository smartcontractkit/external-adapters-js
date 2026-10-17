import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as priceWs from '../../../src/transport/price-ws'
import {
  buildPriceWsTransport,
  TradeProcessor,
  tradeTickers,
} from '../../../src/transport/price-ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

// Spec price sample_response FEED_CONFIG field layout: index 2 = time, 3 = price
const tradeRecord = (time: number, price: number) => [
  'Trade',
  'AAPL:USLF24',
  time,
  price,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
]
const tradeEthRecord = (time: number, price: number) => [
  'TradeETH',
  'AAPL:USLF24',
  time,
  price,
  5,
  12346,
  'V',
  0.13,
  5000001,
  999000001,
  'DOWN',
  true,
]
const tradeFrame = (time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['Trade', tradeRecord(time, price)],
})
const tradeEthFrame = (time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['TradeETH', tradeEthRecord(time, price)],
})

// The framework invokes customSubscriptionMessages with the desired set on every
// background execution BEFORE frames arrive; feed.message fans FEED_DATA records
// out only through the wire keys the builder registered, so a transport-driven
// test must run the same two steps in the same order.
const registerSubs = (transport: unknown, params: unknown): void => {
  ;(
    transport as {
      config: { builders: { customSubscriptionMessages: (c: unknown, s: unknown) => unknown } }
    }
  ).config.builders.customSubscriptionMessages({}, { desired: [params], new: [params], stale: [] })
}
const transportMessage = (transport: unknown, frame: unknown): any[] =>
  (
    transport as { config: { handlers: { message: (m: unknown) => any[] } } }
  ).config.handlers.message(frame)

/** Brings a transport to the post-handshake, subscribed state (FEED_CONFIG then the desired set). */
const connectedTransport = (transport: unknown, params: unknown): unknown => {
  transportMessage(transport, frames.priceFeedConfig)
  registerSubs(transport, params)
  return transport
}

describe('TradeProcessor newest-time state (round-2 item 4: state is per transport instance, not a module singleton)', () => {
  it('exports no module-level tradeProcessor singleton', () => {
    // The former shared singleton leaked newest-time state across transport
    // instances; the module must not export one
    expect((priceWs as unknown as Record<string, unknown>).tradeProcessor).toBeUndefined()
  })

  it('Trade wins over TradeETH only when its time is newer within the same instance', () => {
    const processor = new TradeProcessor()

    // TradeETH is newest at t=2000
    expect(
      processor.processRecord('TradeETH', tradeEthRecord(2000, 190.02), PARAMS as any)?.result,
    ).toBe(190.02)

    // An older regular-hours Trade at t=1500 loses to the TradeETH time
    expect(
      processor.processRecord('Trade', tradeRecord(1500, 189.98), PARAMS as any),
    ).toBeUndefined()

    // A strictly newer Trade at t=2500 wins over the TradeETH
    expect(processor.processRecord('Trade', tradeRecord(2500, 189.99), PARAMS as any)?.result).toBe(
      189.99,
    )

    // Reference semantics: an equal-time record is served like the newest one
    expect(
      processor.processRecord('TradeETH', tradeEthRecord(2500, 190.5), PARAMS as any)?.result,
    ).toBe(190.5)
  })

  it('non-Trade/TradeETH event types produce no result and no newest-time state', () => {
    const processor = new TradeProcessor()
    expect(
      processor.processRecord('Quote', ['Quote', 'AAPL:USLF24', 2000, 1, 2], PARAMS as any),
    ).toBeUndefined()
    // ...so a later Trade at an older time is still the newest Trade seen
    expect(processor.processRecord('Trade', tradeRecord(1000, 189.98), PARAMS as any)?.result).toBe(
      189.98,
    )
  })
})

describe('per-transport newest-time state (round-2 item 4 proving test: buildPriceWsTransport constructs a TradeProcessor per transport)', () => {
  it('two transport instances keep independent newest-time state per symbol', () => {
    const first = connectedTransport(buildPriceWsTransport(), PARAMS)
    const second = connectedTransport(buildPriceWsTransport(), PARAMS)

    // Instance A sees a Trade at t=2000 (spec sample price 189.98)
    const firstTrade = transportMessage(first, tradeFrame(2000, 189.98))
    expect(firstTrade).toHaveLength(1)
    expect(firstTrade[0].response.result).toBe(189.98)
    expect(firstTrade[0].params.base).toBe('AAPL:USLF24')

    // Instance B's first record — a TradeETH at t=1000 — is NOT dropped by
    // instance A's newer time: the transports share no newest-time state
    const secondTradeEth = transportMessage(second, tradeEthFrame(1000, 190.02))
    expect(secondTradeEth).toHaveLength(1)
    expect(secondTradeEth[0].response.result).toBe(190.02)

    // Within instance A the same TradeETH at t=1000 IS older than t=2000: dropped
    expect(transportMessage(first, tradeEthFrame(1000, 190.02))).toEqual([])
  })

  it('the exported transport maps the spec sample Trade frame through its own processor', () => {
    // FEED_CONFIG first (the provider echoes the requested layout back), then the
    // spec sample Trade frame (t=1760000000000, price 189.98) maps to the spec
    // endpoint_request_response_examples[1].response
    const results = transportMessage(
      connectedTransport(priceWs.transport, PARAMS),
      frames.priceTradeFrame,
    )

    expect(results).toHaveLength(1)
    expect(results[0].response.result).toBe(189.98)
    expect(results[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('serves a NaN trade price as an invalid (502) result carrying the record time', () => {
    const processor = new TradeProcessor()
    const invalid = processor.processRecord(
      'Trade',
      tradeRecord(1760000000000, NaN),
      PARAMS as any,
    ) as any

    expect(invalid.statusCode).toBe(502)
    expect(invalid.errorMessage).toContain('invalid')
    expect(invalid.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})

describe('newest-time state keyed by the record eventSymbol (plan item: one dedupe state per wire symbol, not per params.base)', () => {
  // Two params sets whose bases differ only in casing: formatTickers maps both
  // onto ONE wire key (Trade:AAPL:USLF24), so one provider stream serves both
  const UPPER = { base: 'AAPL:USLF24', quote: 'USD' }
  const LOWER = { base: 'aapl:uslf24', quote: 'USD' }

  const sharedKeyTradeFeed = () => {
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => tradeTickers(params.base),
      processRecord: (eventType, record, params: any) =>
        processor.processRecord(eventType, record, params),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [UPPER, LOWER], new: [UPPER, LOWER], stale: [] })
    return feed
  }

  it('both base casings resolve onto one wire key and one dedupe state: an older record after a newer one is served to NEITHER subscription', () => {
    const feed = sharedKeyTradeFeed()

    // The newest record (t=2000) fans out to both params sets
    const newer = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Trade', tradeRecord(2000, 189.99)],
    })
    expect(newer).toHaveLength(2)
    expect(newer.map((r) => (r as any).result)).toEqual([189.99, 189.99])

    // An older record (t=1000) arriving late: dropped against the shared
    // newest-time state, so NEITHER params set is served stale data
    const older = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Trade', tradeRecord(1000, 189.95)],
    })
    expect(older).toEqual([])
  })

  it('the dedupe key is the record eventSymbol itself, so state survives a params set churning', () => {
    const feed = sharedKeyTradeFeed()

    // A record for the wire symbol arrives while only ONE params set is desired
    feed.subscriptionMessages({ desired: [UPPER], new: [UPPER], stale: [] })
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(2000, 189.99)] }),
    ).toHaveLength(1)

    // The second casing subscribes afterwards: the shared (already-seen) newest
    // time still drops the older record for it too
    feed.subscriptionMessages({ desired: [UPPER, LOWER], new: [LOWER], stale: [] })
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(1000, 189.95)] }),
    ).toEqual([])

    // ...while a strictly newer record is served
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(3000, 190.1)] }),
    ).toHaveLength(2)
  })
})
