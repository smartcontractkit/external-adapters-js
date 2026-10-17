import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockDxLinkHandshakeFailureServer } from './dxlink-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles, open timeout) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9096/dxlink-chainlink'
const API_USERNAME = 'fake-api-username'
const API_PASSWORD = 'fake-api-password'

// Spec data_source_authentication.usage.handshake_header:
// "Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>"
const EXPECTED_BASIC_HEADER = `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString(
  'base64',
)}`

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

describe('dxLink connection: Basic auth header and failed handshakes', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let failureServer: ReturnType<typeof mockDxLinkHandshakeFailureServer>

  // The options object and URL the transport hands to every WebSocket it opens.
  // The Basic auth header rides this object onto the real handshake (the
  // cfbenchmarks crypto-ws.ts options() pattern), and the mock-socket bridge
  // itself carries no upgrade headers, so the constructor seam is where the
  // wire-level assertion lives.
  const openedUrls: string[] = []
  const upgradeHeaders: (string | undefined)[] = []

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    // ws:// loopback test bridge served by the framework's mock-socket test
    // support: the URL is injected through WS_API_ENDPOINT only — the spec
    // declares no extra env var for it
    process.env['API_USERNAME'] = API_USERNAME
    process.env['API_PASSWORD'] = API_PASSWORD
    // Short budget so the failed-handshake flows fit a handful of fake-clock steps
    process.env['WS_CONNECTION_OPEN_TIMEOUT'] = '2000'
    // Every handshake in this suite fails, and the framework backs off
    // exponentially across streamHandler failures (100ms * 3^n, up to 20min by
    // default) — cumulative failures from earlier tests would push the next
    // reconnect attempt outside this test's fake-clock window. Factor 1 keeps
    // every retry at STREAM_HANDLER_RETRY_MIN_MS so reconnects stay prompt and
    // deterministic regardless of how many failures came before.
    process.env['STREAM_HANDLER_RETRY_MIN_MS'] = '100'
    process.env['STREAM_HANDLER_RETRY_EXP_FACTOR'] = '1'
    process.env['STREAM_HANDLER_RETRY_MAX_MS'] = '3000'
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

    failureServer = mockDxLinkHandshakeFailureServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    failureServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  /** Forces a fresh connection attempt and waits for the mock to accept it. */
  const reconnect = async (): Promise<number> => {
    const connectionsBefore = failureServer.connections.length
    failureServer.connections[failureServer.connections.length - 1]?.close()
    for (let i = 0; i < 20 && failureServer.connections.length <= connectionsBefore; i++) {
      await step()
    }
    expect(failureServer.connections.length).toBeGreaterThan(connectionsBefore)
    return failureServer.connections.length - 1
  }

  it('opens the dxLink connection with the spec Basic Authorization header', async () => {
    // First request opens the dxLink connection (never completed here — the
    // failure flows below own that part); the header is built at open time.
    await testAdapter.request(quoteRequest)
    for (let i = 0; i < 20 && openedUrls.length === 0; i++) {
      await step()
    }

    expect(openedUrls).toContain(WS_URL)
    expect(upgradeHeaders).toContain(EXPECTED_BASIC_HEADER)
  })

  it('never serves a value when the provider never sends FEED_CONFIG: the handshake times out within WS_CONNECTION_OPEN_TIMEOUT and requests error', async () => {
    // Drop the current connection and observe the fresh attempt's handshake on
    // the wire: the client sends the spec primary_command sequence, the mock
    // acknowledges nothing, and no value may ever be served.
    const connIndex = await reconnect()
    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(504)

    for (let i = 0; i < 5 && (failureServer.framesByConnection[connIndex] ?? []).length < 3; i++) {
      await step()
    }
    const types = (failureServer.framesByConnection[connIndex] ?? [])
      .map((raw) => {
        try {
          return JSON.parse(raw).type as string
        } catch {
          return undefined
        }
      })
      .filter((t): t is string => Boolean(t))
    expect(types.slice(0, 3)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

    // Tick well past the 2s open timeout (and the reconnect retries) — with no
    // FEED_CONFIG ever arriving, no value may ever be served
    for (let i = 0; i < 10; i++) {
      await step()
    }
    const after = await testAdapter.request(quoteRequest)
    expect(after.statusCode).toBe(504)
  })

  it('surfaces the provider ERROR frame as a handshake failure: the open gate rejects and no value is served', async () => {
    // The provider's unauthorized-credential reply: an ERROR control frame
    // instead of FEED_CONFIG (spec data_source_authentication — Basic auth is
    // what the prod endpoint verifies; the dxLink AUTH message is NOT used).
    // The open gate must reject on the ERROR frame — the caller gets an error,
    // never a value, and never the open timeout waited out in vain.
    failureServer.setMode('error')
    const connIndex = await reconnect()

    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(504)

    // The spec handshake still went out on the wire before the ERROR arrived;
    // the reply the mock sent back is the ERROR frame, not FEED_CONFIG
    for (let i = 0; i < 5 && (failureServer.framesByConnection[connIndex] ?? []).length < 3; i++) {
      await step()
    }
    const types = (failureServer.framesByConnection[connIndex] ?? [])
      .map((raw) => {
        try {
          return JSON.parse(raw).type as string
        } catch {
          return undefined
        }
      })
      .filter((t): t is string => Boolean(t))
    expect(types.slice(0, 3)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])
  })

  it('surfaces a connection error and stays up when the provider rejects the connection', async () => {
    // Provider rejects the handshake (immediate close): the adapter must surface
    // an error to the caller — never a value, never a hang — and stay alive.
    failureServer.setMode('reject')
    await reconnect()

    const response = await testAdapter.request(quoteRequest)
    expect(response.statusCode).toBe(504)

    // The adapter is still serving (errors, not hung or crashed)
    const later = await testAdapter.request(quoteRequest)
    expect(later.statusCode).toBe(504)
  })
})
