import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../../src/config'
import {
  quoteRecordToResult,
  transport as stockQuotesTransport,
} from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item 7 proving test (spec keepalive interval_seconds=30; owner decisions
 * reconnect_cache_behavior=serve_cached_last_value and
 * degraded_stream_alerting=metrics_counters_only). The unit-owned pieces: the
 * heartbeat handler emits exactly the dxLink KEEPALIVE frame the framework's
 * 30s timer sends, the config pins WS_HEARTBEAT_INTERVAL_MS at 30000, and an
 * in-band CHANNEL_CLOSED frame forces the socket close that hands reconnect +
 * resubscribe (and the wsConnectionClosures counter) to the framework — with no
 * adapter mapping state lost, so the cached last value stays servable across
 * the reconnect window. The timer, ResponseCache and metrics counters
 * themselves are framework-owned (out of unit scope; the integration suites
 * prove them on the wire).
 */

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('heartbeat frame (spec data_source_endpoints.keepalive interval_seconds=30, framework WS_HEARTBEAT_INTERVAL_MS)', () => {
  it('each heartbeat tick sends exactly the dxLink KEEPALIVE frame on channel 0', () => {
    // The framework heartbeat timer invokes handlers.heartbeat once per
    // WS_HEARTBEAT_INTERVAL_MS while the channel is open; the adapter owns the
    // frame that tick carries
    const send = jest.fn()
    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('pins the heartbeat cadence at the 30000ms default (spec interval_seconds=30)', () => {
    // The envDefaultOverride in src/config pins the spec cadence: a deployment
    // that sets no WS_HEARTBEAT_INTERVAL_MS keeps 30s
    const oldEnv = process.env['WS_HEARTBEAT_INTERVAL_MS']
    delete process.env['WS_HEARTBEAT_INTERVAL_MS']
    try {
      config.initialize()
      expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(30000)
    } finally {
      if (oldEnv !== undefined) {
        process.env['WS_HEARTBEAT_INTERVAL_MS'] = oldEnv
      }
      config.initialize()
    }
  })
})

describe('forced close -> reconnect window (owner decision reconnect_cache_behavior=serve_cached_last_value)', () => {
  it('an in-band CHANNEL_CLOSED frame closes the socket (the framework then reconnects, resubscribes and counts the closure) and yields no data', () => {
    const feed = quoteFeed()
    const close = jest.fn()
    feed.setConnection({ send: jest.fn(), addEventListener: jest.fn(), close } as any)

    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('the cached last value stays servable with its ORIGINAL provider timestamp across the close + resubscribe window', () => {
    const feed = quoteFeed()

    // The last mapped value before the disconnect: the spec sample frame's
    // freshest record — mid 190.0, provider time 1760000001000
    const lastValue = feed.message(frames.stockQuotesFrame as any)
    expect(lastValue).toHaveLength(1)
    expect(lastValue[0]).toMatchObject({
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
    })

    // The server closes the channel: no data result, and NO adapter mapping
    // state is reset — the framework's ResponseCache keeps serving this last
    // value during the reconnect + re-handshake window
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects, re-delivers the desired set as `new`; the same
    // frame still maps to the same cacheable success — no max-age rejection
    // (owner decision stale_quote_serving=serve_last_value_with_timestamp)
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
    const afterReconnect = feed.message(frames.stockQuotesFrame as any)
    expect(afterReconnect).toHaveLength(1)
    expect(afterReconnect[0]).toMatchObject({
      result: 190.0,
      data: {
        mid_price: 190.0,
        bid_price: 189.9,
        bid_volume: 50,
        ask_price: 190.1,
        ask_volume: 80,
      },
      timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
    })
    expect((afterReconnect[0] as any).statusCode).toBeUndefined()
    expect((afterReconnect[0] as any).errorMessage).toBeUndefined()
  })
})
