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
 * Plan proving test (round1-transport-ws, OPDATA-9200): the dxLink WebSocket
 * transport boots through the real request path — the mock WS server sees the
 * spec primary_command handshake (SETUP, CHANNEL_REQUEST, FEED_SETUP) carrying
 * the Basic Authorization header, answers FEED_CONFIG, and the open gate
 * resolves within the WS_CONNECTION_OPEN_TIMEOUT budget (proven behaviorally:
 * the FEED_SUBSCRIPTION add only goes out after the open handler settled, and
 * the spec example response is served through the connection).
 *
 * Every expectation is the spec's own: data_source_authentication.usage
 * .handshake_header, primary_command message payloads, and the stock_quotes
 * endpoint_request_response_examples pair. Fake loopback host only
 * (test_fake_urls): the provider host lives only in the src/config default.
 */

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9108/dxlink-chainlink'
const API_USERNAME = 'fake-api-username'
const API_PASSWORD = 'fake-api-password'

// Spec data_source_authentication.usage.handshake_header:
// "Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>"
const EXPECTED_BASIC_HEADER = `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString(
  'base64',
)}`

// Spec stock_quotes sample_response's verbatim COMPACT frame: TWO Quote records
// concatenated (acceptAggregationPeriod=1 batching); the spec example response
// derives from the newest (second) record.
setFeedDataRecords('Quote', 'AAPL:USLF24', [
  ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
  ['Quote', 'AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'],
])

// Spec endpoint_request_response_examples request (stock_quotes)
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

type AnyMsg = Record<string, any>

const parseFrame = (raw: string): AnyMsg | undefined => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

describe('dxLink handshake: Basic auth, primary_command sequence, FEED_CONFIG open gate', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  // The options object and URL the transport hands to every WebSocket it opens.
  // The Basic auth header rides this object onto the real handshake (the
  // cfbenchmarks crypto-ws.ts options() pattern); the mock-socket bridge itself
  // carries no upgrade headers, so the constructor seam is where the wire-level
  // header assertion lives.
  const openedUrls: string[] = []
  const upgradeHeaders: (string | undefined)[] = []

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
    process.env['API_USERNAME'] = API_USERNAME
    process.env['API_PASSWORD'] = API_PASSWORD
    // Budget the handshake must fit (spec framework_alignment
    // connection_open_timeout): short, so the flows stay deterministic
    process.env['WS_CONNECTION_OPEN_TIMEOUT'] = '2000'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    const BaseWS: any = WebSocketClassProvider.get()
    class RecordingWS extends BaseWS {
      // The framework's WebSocketTransport constructs `new ctor(url, undefined, options)`
      // (ws-library signature): the request options carrying the headers are the
      // THIRD constructor argument.
      constructor(url: string, protocols?: unknown, opts?: { headers?: Record<string, string> }) {
        openedUrls.push(url)
        upgradeHeaders.push(opts?.headers?.Authorization)
        super(url, opts instanceof Object ? undefined : protocols)
      }
    }
    WebSocketClassProvider.set(RecordingWS as any)

    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('performs the spec primary_command handshake with the Basic auth header, gates on FEED_CONFIG, and serves the spec example within the open budget', async () => {
    // The whole handshake — open gate included — must fit WS_CONNECTION_OPEN_TIMEOUT
    // (2s here): requestUntilCached only succeeds if the open gate resolved
    // (the FEED_SUBSCRIPTION add only goes out after FEED_CONFIG settled it)
    // and the FEED_DATA row parsed through the FEED_CONFIG field order.
    const response = await requestUntilCached(quoteRequest, 1760000001000)
    expect(response.statusCode).toBe(200)
    // Spec endpoint_request_response_examples (stock_quotes), field-for-field
    expect(response.json()).toMatchObject({
      data: {
        mid_price: 190.0,
        bid_price: 189.9,
        bid_volume: 50,
        ask_price: 190.1,
        ask_volume: 80,
      },
      result: 190.0,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000001000,
      },
    })

    // The connection opened at WS_API_ENDPOINT with the spec Basic Authorization
    // header built from API_USERNAME/API_PASSWORD
    expect(openedUrls).toContain(WS_URL)
    expect(upgradeHeaders).toContain(EXPECTED_BASIC_HEADER)

    // The first three client frames are the spec primary_command messages
    const frames = (clientFrameLog[0] ?? []).map(parseFrame).filter(Boolean) as AnyMsg[]
    expect(frames.slice(0, 3).map((m) => m.type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])
    const [setup, channelRequest, feedSetup] = frames
    expect(setup).toMatchObject({
      channel: 0,
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
      version: '0.1-js/1.0.0',
    })
    expect(channelRequest).toMatchObject({
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    expect(feedSetup).toMatchObject({
      channel: 1,
      acceptAggregationPeriod: 1,
      acceptDataFormat: 'COMPACT',
    })
    // Spec stock_quotes FEED_CONFIG eventFields.Quote (the request the
    // primary_command sends)
    expect(feedSetup.acceptEventFields.Quote).toEqual([
      'eventType',
      'eventSymbol',
      'time',
      'bidPrice',
      'askPrice',
      'bidSize',
      'askSize',
      'bidExchangeCode',
      'askExchangeCode',
    ])

    // The FEED_CONFIG gate is proven behaviorally: the mock server answers
    // FEED_SETUP with FEED_CONFIG and only pushes FEED_DATA on a
    // FEED_SUBSCRIPTION add — the subscription add on the wire and the served
    // spec example above are the proof the open gate settled on FEED_CONFIG.
    const adds = frames.filter((m) => m.type === 'FEED_SUBSCRIPTION').flatMap((m) => m.add ?? [])
    expect(adds).toContainEqual({ symbol: 'AAPL:USLF24', type: 'Quote' })
  })
})
