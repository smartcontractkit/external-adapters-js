import type { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { customSubscriptionMessages } from '../../src/transport/common'

type Params = { base: string; quote: string; requireVolume?: boolean }

const SUBSCRIBE = 'subscribe_market_data'
const UNSUBSCRIBE = 'unsubscribe_market_data'

const buildPair = (params: Params) => `${params.base}/${params.quote}`

const aapl: Params = { base: 'Equity:US:AAPL', quote: 'USD' }
const aaplWithVolume: Params = { ...aapl, requireVolume: true }
const spy: Params = { base: 'ETF:US:SPY', quote: 'USD' }
const spx: Params = { base: 'Index:US:SPX', quote: 'USD' }

const deltas = (partial: Partial<SubscriptionDeltas<Params>>): SubscriptionDeltas<Params> => ({
  desired: [],
  new: [],
  stale: [],
  ...partial,
})

const build = (subscriptions: SubscriptionDeltas<Params>) =>
  customSubscriptionMessages(subscriptions, buildPair, SUBSCRIBE, UNSUBSCRIBE)

describe('customSubscriptionMessages', () => {
  it('returns no messages when nothing is new or stale', () => {
    expect(build(deltas({ desired: [aapl] }))).toEqual([])
  })

  it('subscribes with every desired pair, not only the new ones', () => {
    const messages = build(deltas({ desired: [aapl, spy], new: [spy] }))
    expect(messages).toEqual([
      { method: SUBSCRIBE, params: { pairs: ['Equity:US:AAPL/USD', 'ETF:US:SPY/USD'] } },
    ])
  })

  it('sends each pair once when subscriptions differ only by non-pair params', () => {
    const messages = build(deltas({ desired: [aapl, aaplWithVolume, spy], new: [aaplWithVolume] }))
    expect(messages).toEqual([
      { method: SUBSCRIBE, params: { pairs: ['Equity:US:AAPL/USD', 'ETF:US:SPY/USD'] } },
    ])
  })

  it('unsubscribes stale pairs once each', () => {
    const messages = build(deltas({ desired: [spy], stale: [aapl, aaplWithVolume] }))
    expect(messages).toEqual([{ method: UNSUBSCRIBE, params: { pairs: ['Equity:US:AAPL/USD'] } }])
  })

  it('does not unsubscribe a pair that is still desired under another variant', () => {
    expect(build(deltas({ desired: [aapl], stale: [aaplWithVolume] }))).toEqual([])
  })

  it('only unsubscribes pairs with no remaining desired subscription', () => {
    const messages = build(deltas({ desired: [aapl], stale: [aaplWithVolume, spy] }))
    expect(messages).toEqual([{ method: UNSUBSCRIBE, params: { pairs: ['ETF:US:SPY/USD'] } }])
  })

  it('emits subscribe before unsubscribe when both are needed', () => {
    const messages = build(deltas({ desired: [spx], new: [spx], stale: [aapl] }))
    expect(messages.map((m) => m.method)).toEqual([SUBSCRIBE, UNSUBSCRIBE])
  })

  it('serializes pairs as JSON arrays for the wire', () => {
    const messages = build(deltas({ desired: [aapl, aaplWithVolume], new: [aapl], stale: [spy] }))
    expect(messages).toHaveLength(2)
    for (const message of messages) {
      const wire = JSON.parse(JSON.stringify(message))
      expect(Array.isArray(wire.params.pairs)).toBe(true)
      expect(wire.params.pairs.length).toBeGreaterThan(0)
    }
  })
})
