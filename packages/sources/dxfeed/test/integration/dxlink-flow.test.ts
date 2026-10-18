import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { clientFrameLog, mockDxLinkServer, setFeedDataRecords } from './dxlink-mocks'

/**
 * Plan proving test (round1-test-scaffolding-mock-ws): the full dxLink flow —
 * handshake, subscribe, FEED_DATA — against a mock dxLink server reproduces
 * BOTH spec endpoint_request_response_examples responses field-for-field on
 * the data/result/timestamps fields. Mock-only per owner decision
 * live_verification = mock_only (the operator runs the primary_command against
 * prod before sign-off; the build records no live evidence).
 *
 * Every expectation below is taken from the spec (OPDATA-9200.yaml):
 * - the two endpoint_request_response_examples request/response pairs
 * - the primary_command wire sequence: SETUP (channel 0) -> CHANNEL_REQUEST
 *   (channel 1, service FEED, contract AUTO) -> FEED_SETUP (COMPACT) ->
 *   FEED_SUBSCRIPTION add entries
 * - the price endpoint description: "Subscribe BOTH event types" (Trade and
 *   TradeETH; the :USLF24 suffix symbol carries both per the match_reference
 *   owner decision tradeteth_subscription_policy)
 * - keepalive.interval_seconds = 30
 */

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9107/dxlink-chainlink'

// The spec stock_quotes sample_response's VERBATIM FEED_DATA frame: one COMPACT
// row concatenating the two Quote records for AAPL:USLF24. Overrides the
// single-record dxlink-mocks.ts registration for this suite: the spec example
// response derives from the newest (second) record.
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
])
// The spec price sample_response's VERBATIM Trade FEED_DATA frame is registered
// in dxlink-mocks.ts (Trade, AAPL:USLF24, time 1760000000000, price 189.98).

// Spec endpoint_request_response_examples requests, verbatim
const quoteRequest = {
  endpoint: 'stock_quotes',
  from: 'AAPL',
  to: 'USD',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

const priceRequest = {
  endpoint: 'stock',
  from: 'AAPL',
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

type ClientFrame = {
  type?: string
  channel?: number
  service?: string
  parameters?: any
  acceptEventFields?: Record<string, unknown>
  add?: { symbol?: string; type?: string }[]
}

const parseFrame = (raw: string): ClientFrame => {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * The client->server wire frames of the connection whose FEED_SUBSCRIPTION adds
 * carry `eventType` entries. Each endpoint runs its own dxLink connection and
 * the FEED_SETUP requests all event-field layouts on every connection, so the
 * subscription entries are what tell the connections apart: the stock_quotes
 * session is the one adding Quote entries, the price session the one adding
 * Trade (and TradeETH) entries.
 */
const connectionFramesFor = (eventType: string): ClientFrame[] => {
  const frames = clientFrameLog.find((connectionFrames) =>
    connectionFrames.some((raw) => {
      const msg = parseFrame(raw)
      return msg.type === 'FEED_SUBSCRIPTION' && (msg.add ?? []).some((e) => e?.type === eventType)
    }),
  )
  return (frames ?? []).map(parseFrame)
}

describe('dxLink flow: handshake + subscribe + FEED_DATA reproduces the spec example responses', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // WS subscription semantics: the first request subscribes and may 504 while
  // the bridge delivers the handshake + FEED_DATA frames; poll deterministically
  // until the cache holds the value at `untilTimestamp`
  const requestUntilCached = async (
    params: Record<string, unknown>,
    untilTimestamp?: number,
  ): Promise<{ statusCode: number; json: () => any }> => {
    let response = await testAdapter.request(params)
    const ready = (r: { statusCode: number; json: () => any }) =>
      r.statusCode !== 504 &&
      (untilTimestamp === undefined ||
        r.json()?.timestamps?.providerIndicatedTimeUnixMs === untilTimestamp)
    for (let i = 0; i < 20 && !ready(response); i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    // ws:// loopback test bridge served by the framework's mock-socket test
    // support: the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag is the ONLY thing
    // that admits the plaintext ws:// endpoint
    process.env['ALLOW_PLAINTEXT_WS_TEST'] = 'true'
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Run the full flow for both endpoints sharing the spec's sample symbol:
    // handshake -> FEED_SUBSCRIPTION -> FEED_DATA -> cached spec example value
    await requestUntilCached(quoteRequest, 1760000001000)
    await requestUntilCached(priceRequest, 1760000000000)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('stock_quotes: spec primary_command wire sequence, then the spec example response field-for-field', async () => {
    // The spec primary_command wire sequence on the quote connection's first
    // four control messages: SETUP (channel 0) -> CHANNEL_REQUEST (channel 1,
    // service FEED, contract AUTO) -> FEED_SETUP (COMPACT, Quote event fields)
    // -> FEED_SUBSCRIPTION
    const frames = connectionFramesFor('Quote')
    const control = frames.filter((msg) => msg.type !== 'KEEPALIVE').slice(0, 4)
    expect(control.map(({ type }) => type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
      'FEED_SUBSCRIPTION',
    ])
    const [setup, channelRequest, feedSetup, subscription] = control as any[]
    expect(setup).toMatchObject({ channel: 0 })
    expect(channelRequest).toMatchObject({
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    expect(feedSetup).toMatchObject({
      channel: 1,
      acceptDataFormat: 'COMPACT',
      acceptEventFields: { Quote: expect.anything() },
    })
    // The stock_quotes endpoint subscribes Quote events for the requested symbol
    expect(subscription.add).toEqual(
      expect.arrayContaining([{ symbol: 'AAPL:USLF24', type: 'Quote' }]),
    )

    // Spec endpoint_request_response_examples stock_quotes response,
    // field-for-field on data/result/timestamps
    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(body.result).toBe(190.0)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1760000001000)
  })

  it('price: subscribes Trade AND TradeETH on the wire, then the spec example response field-for-field', async () => {
    // Spec price endpoint: "Subscribe BOTH event types for every symbol" — the
    // :USLF24 symbol carries both FEED_SUBSCRIPTION add entries on the wire
    const frames = connectionFramesFor('Trade')
    const subscription = frames.find((msg) => msg.type === 'FEED_SUBSCRIPTION') as any
    expect(subscription?.add).toEqual(
      expect.arrayContaining([
        { symbol: 'AAPL:USLF24', type: 'Trade' },
        { symbol: 'AAPL:USLF24', type: 'TradeETH' },
      ]),
    )

    // Spec endpoint_request_response_examples stock response, field-for-field
    // on data/result/timestamps
    const response = await testAdapter.request(priceRequest)
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toEqual({ result: 189.98 })
    expect(body.result).toBe(189.98)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('sends the dxLink KEEPALIVE on the wire at the spec keepalive interval (30s)', async () => {
    // Spec keepalive.interval_seconds = 30 (WS_HEARTBEAT_INTERVAL_MS=30000):
    // advancing the clock past one interval puts a KEEPALIVE control frame on
    // the client->server wire
    const keepaliveOnWire = (): boolean =>
      clientFrameLog.some((connectionFrames) =>
        connectionFrames.some((raw) => parseFrame(raw).type === 'KEEPALIVE'),
      )
    for (let i = 0; i < 35 && !keepaliveOnWire(); i++) {
      await step()
    }
    expect(keepaliveOnWire()).toBe(true)
  })
})
