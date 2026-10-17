import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'
import { mockDxLinkServer, setFeedData } from './dxlink-mocks'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery, nock I/O).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9103/dxlink-chainlink'

// Plan round-2 item 5 (endpoint-price routing pair): the `transport` param is
// carried at runtime by priceParamsDefinition and read by the framework router
// against the endpoint's transportRoutes (ws -> the dxLink WebSocketTransport,
// rest -> the untouched price-http transport). Each case uses a symbol served
// by exactly ONE of the two mocks, so the served value itself proves which
// transport resolved the request:
// - WSRV exists ONLY as a Trade record on the mock dxLink socket (and is in no
//   REST fixture), and no nock interceptor can produce its price
// - IBM exists ONLY in the batched REST fixture (no dxLink frame is registered
//   for it, so the ws transport could never serve it)
setFeedData('Trade', 'WSRV', [
  'Trade',
  'WSRV',
  1760000008000,
  187.25,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
])

describe('price endpoint transport routing (plan item 5)', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // The first request of either transport may 504 while its background cycle
  // resolves (WS handshake + FEED_DATA frames, REST batch fetch); poll
  // deterministically until the cache holds a value at `untilTimestamp`
  // (any value when omitted)
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
    // support: the URL is injected through WS_API_ENDPOINT only — the spec
    // declares no extra env var for it
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    // The untouched REST transport reads API_ENDPOINT from settings, so the
    // nock interceptor in rest-mocks.ts is what REST requests hit — never a
    // real provider host
    process.env['API_ENDPOINT'] = FAKE_REST_ENDPOINT

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)
    mockBatchedRestTransport()

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
    // cleanAll only: nock.restore() kills the interceptor process-wide, so any
    // suite sharing this jest worker afterwards would hit real DNS instead of
    // its mock (the repo-wide teardown convention)
    nock.cleanAll()
  })

  it('routes a transport="ws" request through the dxLink transport and serves its result', async () => {
    // Spec price input_parameters: "ws" (dxLink stream). Validation passes with
    // the reserved-name transport param present, and the served 187.25 can only
    // have come from the mock dxLink socket's WSRV Trade record
    const response = await requestUntilCached(
      { endpoint: 'stock', base: 'WSRV', to: 'USD', transport: 'ws' },
      1760000008000,
    )
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 187.25 },
      result: 187.25,
      timestamps: {
        providerIndicatedTimeUnixMs: 1760000008000,
      },
    })
  })

  it('routes a transport="rest" request through the REST transport', async () => {
    // Spec price input_parameters: "rest". The served 142.5 can only have come
    // from the nock REST fixture (no dxLink frame exists for IBM), and the
    // request passes validation with the transport param present
    const response = await requestUntilCached({
      endpoint: 'stock',
      base: 'IBM',
      to: 'USD',
      transport: 'rest',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      data: { result: 142.5 },
      result: 142.5,
    })
  })
})
