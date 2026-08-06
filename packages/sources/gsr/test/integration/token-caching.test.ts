import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'
import { transport } from '../../src/transport/price'
import { mockWebSocketServer } from './fixtures'

// GSR issues one hour tokens in production, but the scenario is scaled down so
// the refresh point lands inside the window the framework's unresponsiveness
// watchdog allows (WS_SUBSCRIPTION_UNRESPONSIVE_TTL caps at 180s). With a 400s
// token the adapter should tear down at 100s, well before the watchdog at 180s
// could do it instead — otherwise these assertions would hold with or without
// the fix. The reply body is a function so the expiry tracks the fake clock.
const TOKEN_VALIDITY_MS = 400 * 1000
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000 // must match the transport
const MS_UNTIL_SCHEDULED_REFRESH = TOKEN_VALIDITY_MS - TOKEN_REFRESH_MARGIN_MS
const UNRESPONSIVE_TTL_MS = 180 * 1000
const OPEN = 1 // WebSocket.OPEN

const mockRollingToken = () =>
  nock('https://oracle.prod.gsr.io', { encodedQueryParams: true })
    .post('/v1/token', {
      apiKey: 'test-pub-key',
      userId: 'test-user-id',
      ts: /^\d+$/,
      signature: /^[0-9a-f]+$/i,
    })
    .reply(200, () => ({
      success: true,
      ts: Date.now() * 1e6,
      token: 'fake-token',
      validUntil: new Date(Date.now() + TOKEN_VALIDITY_MS).toISOString(),
    }))
    .persist()

describe('token expiry driven reconnection', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const wsEndpoint = 'ws://localhost:9091'
  const data = {
    base: 'ETH',
    quote: 'USD',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = 'test-priv-key'
    // Hold the watchdog at its maximum so it cannot reach the refresh point
    // first. At its 120s default it recycles the connection on its own and the
    // assertions below pass whether or not the adapter does anything, which is
    // precisely the broken behaviour being fixed.
    process.env['WS_SUBSCRIPTION_UNRESPONSIVE_TTL'] = String(UNRESPONSIVE_TTL_MS)

    mockRollingToken()
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(data)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
    nock.cleanAll()
  })

  it('holds a live connection open while the token is valid', async () => {
    expect(transport.wsConnection).toBeDefined()

    // Well short of the refresh point: nothing should disturb the connection.
    const connection = transport.wsConnection
    await testAdapter.clock?.tickAsync(10 * 1000)
    expect(transport.wsConnection).toBe(connection)
  })

  it('tears the connection down before the token expires and reconnects', async () => {
    const connectionBeforeRefresh = transport.wsConnection
    expect(connectionBeforeRefresh).toBeDefined()

    // Advance the way production runs: under continuous traffic, so the
    // subscription set stays alive. Idling past WS_SUBSCRIPTION_TTL (120s)
    // would drop the subscriptions and leave the loop nothing to reconnect for.
    const STEP_MS = 30 * 1000
    const stopShortOf = MS_UNTIL_SCHEDULED_REFRESH - STEP_MS
    for (let elapsed = 0; elapsed < stopShortOf; elapsed += STEP_MS) {
      await testAdapter.clock?.tickAsync(Math.min(STEP_MS, stopShortOf - elapsed))
      await testAdapter.request(data)
    }

    // A minute short of the threshold the connection must still be the original
    // one — tearing down early would throw away a perfectly good token.
    expect(transport.wsConnection).toBe(connectionBeforeRefresh)
    expect(connectionBeforeRefresh?.readyState).toEqual(OPEN)

    await testAdapter.clock?.tickAsync(STEP_MS)

    // Previously the adapter only dropped its cached token and left this socket
    // open. GSR then went silent at the 60 minute mark and the cache went stale
    // (CACHE_MAX_AGE, 90s) a full 30s before the framework's unresponsiveness
    // watchdog (WS_SUBSCRIPTION_UNRESPONSIVE_TTL, 120s) reconnected — which is
    // the window that served 504s. The socket must be closed outright instead,
    // while the provider is still sending data.
    expect(connectionBeforeRefresh?.readyState).not.toEqual(OPEN)

    // And the framework must actually bring it back: the teardown deliberately
    // leaves wsConnection set so streamHandler's early return doesn't strand it.
    for (let i = 0; i < 10 && transport.wsConnection?.readyState !== OPEN; i++) {
      await testAdapter.clock?.tickAsync(1000)
      await testAdapter.request(data)
    }
    expect(transport.wsConnection?.readyState).toEqual(OPEN)
    expect(transport.wsConnection).not.toBe(connectionBeforeRefresh)

    const response = await testAdapter.request(data)
    expect(response.statusCode).toEqual(200)
  })
})
