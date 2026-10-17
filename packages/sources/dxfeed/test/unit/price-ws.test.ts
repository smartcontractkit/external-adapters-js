import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { buildPriceWsTransport, TradeProcessor } from '../../src/transport/price-ws'
import frames from './fixtures/dxlink-frames.json'

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
const tradeFrame = (time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['Trade', tradeRecord(time, price)],
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
const unsubscribeSubs = (transport: unknown, params: unknown): void => {
  ;(
    transport as {
      config: { builders: { customSubscriptionMessages: (c: unknown, s: unknown) => unknown } }
    }
  ).config.builders.customSubscriptionMessages({}, { desired: [], new: [], stale: [params] })
}
const transportMessage = (transport: unknown, frame: unknown): any[] =>
  (
    transport as { config: { handlers: { message: (m: unknown) => any[] } } }
  ).config.handlers.message(frame)

describe('TradeProcessor unsubscribe cleanup (round-2: newest-time state must not survive unsubscribe)', () => {
  it('subscribe symbol A, receive a Trade, unsubscribe A: latestTimeBySymbol has no entry for A', () => {
    const processor = new TradeProcessor()

    // Subscribe + a provider Trade (spec sample price 189.98 at t=1760000000000)
    expect(
      processor.processRecord('Trade', tradeRecord(1760000000000, 189.98), PARAMS as any)?.result,
    ).toBe(189.98)
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(1760000000000)

    // The remove path of customSubscriptionMessages: the last subscription for
    // the wire key is gone
    processor.unsubscribe([{ symbol: 'AAPL:USLF24', type: 'Trade' }])

    expect(processor.latestTimeBySymbol).not.toHaveProperty('AAPL:USLF24')
  })

  it('clears the state for both subscribed event types of a :USLF24 symbol (Trade AND TradeETH), matching the tradeTickers entries', () => {
    const processor = new TradeProcessor()
    processor.processRecord('Trade', tradeRecord(2000, 189.98), PARAMS as any)
    processor.processRecord('TradeETH', tradeRecord(2500, 190.02), PARAMS as any)
    expect(Object.keys(processor.latestTimeBySymbol)).toEqual(['AAPL:USLF24'])

    processor.unsubscribe([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])

    expect(processor.latestTimeBySymbol).not.toHaveProperty('AAPL:USLF24')
  })

  it('resubscription after unsubscribe starts the newest-time state fresh', () => {
    const processor = new TradeProcessor()
    processor.processRecord('Trade', tradeRecord(2000, 189.98), PARAMS as any)
    processor.unsubscribe([{ symbol: 'AAPL:USLF24', type: 'Trade' }])

    // An older record after a fresh resubscription is served — there is no
    // carried-over newest time to drop it against
    expect(processor.processRecord('Trade', tradeRecord(1000, 189.95), PARAMS as any)?.result).toBe(
      189.95,
    )
  })
})

describe('price WS transport remove path (the cleanup is wired into customSubscriptionMessages, not just the processor)', () => {
  it('subscribe A, receive a Trade, unsubscribe A, resubscribe A: an older Trade is served again because the remove path deleted the newest-time state', () => {
    const transport = buildPriceWsTransport()
    transportMessage(transport, frames.priceFeedConfig)
    registerSubs(transport, PARAMS)

    // The newest Trade (t=2000) is served; an older one (t=1000) is dropped
    // against the newest-time state while the subscription is live
    expect(transportMessage(transport, tradeFrame(2000, 189.98))).toHaveLength(1)
    expect(transportMessage(transport, tradeFrame(1000, 189.95))).toEqual([])

    // Unsubscribe A (desired: [], stale: [A]) — the remove path fires the cleanup
    unsubscribeSubs(transport, PARAMS)

    // Resubscribe A: the stale-record guard starts fresh, so the t=1000 Trade
    // is served — proof the entry was deleted on unsubscribe
    registerSubs(transport, PARAMS)
    const older = transportMessage(transport, tradeFrame(1000, 189.95))
    expect(older).toHaveLength(1)
    expect(older[0].response.result).toBe(189.95)
    expect(older[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1000 })
  })
})
