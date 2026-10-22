import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  MockWebsocketServer,
  TestAdapter,
  mockWebSocketProvider,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'
import {
  AAPL_QUOTE,
  ACCESS_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  defaultEnvUrls,
  mockTokenResponse,
  mockWebsocketServer,
  pushFrames,
  subscribeMessage,
} from './fixtures'

// Captured before FakeTimers.install replaces the global
const realSetTimeout = setTimeout

// Spec refresh_policy per_connect: the token endpoint issues a different token per exchange
const SECOND_ACCESS_TOKEN = 'fake-access-token-2'
const ISSUED_TOKENS = [ACCESS_TOKEN, SECOND_ACCESS_TOKEN]

// Spec endpoint_request_response_examples[0]
const exampleRequest = { from: 'AAPL', to: 'USD' }
const exampleData = {
  mid_price: 190.0,
  bid_price: 189.95,
  bid_volume: 1,
  ask_price: 190.05,
  ask_volume: 2,
}

// Owner decision reconnect_backoff=cut: the framework owns reconnects. After a server-side close
// the adapter reconnects, exchanges a new token (refresh_policy per_connect), authenticates with it
// (spec ws_auth_message) and sends the spec subscribe message again, so the stream resumes.
describe('stock_quotes reconnect resubscribe', () => {
  let testAdapter: TestAdapter
  let mockWsServer: MockWebsocketServer | undefined
  let oldEnv: NodeJS.ProcessEnv
  const received: { action?: string; key?: string; secret?: string; quotes?: string[] }[] = []
  const tokenBodies: string[] = []

  // nock replies on a real timer, so each step also yields real time
  const step = async () => {
    await testAdapter.clock.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CLIENT_ID'] = CLIENT_ID
    process.env['CLIENT_SECRET'] = CLIENT_SECRET
    delete process.env['API_KEY']
    delete process.env['AUTH_ENDPOINT']
    delete process.env['WS_API_ENDPOINT']
    const { auth: defaultAuthUrl, ws: defaultWsUrl } = defaultEnvUrls()

    mockTokenResponse((body) => tokenBodies.push(body), ISSUED_TOKENS, defaultAuthUrl)
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(defaultWsUrl, received, ISSUED_TOKENS)

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-09-17T00:31:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    nock.cleanAll()
    nock.restore()
  })

  it('reconnects after a server close with a new token and resubscribes', async () => {
    // First connection serves the spec example
    let response = await testAdapter.request(exampleRequest)
    for (let i = 0; i < 10 && response.statusCode !== 200; i++) {
      await step()
      response = await testAdapter.request(exampleRequest)
    }
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ result: 190.0, data: exampleData })
    expect(tokenBodies).toHaveLength(1)

    // Server-side close
    const mark = received.length
    mockWsServer?.clients().forEach((client) => client.close())
    const after = () => received.slice(mark)
    for (let i = 0; i < 20 && !after().some((m) => m.action === 'subscribe'); i++) {
      await step()
    }

    // One new token exchange, with the spec form-encoded client credentials
    expect(tokenBodies).toHaveLength(2)
    expect(Object.fromEntries(new URLSearchParams(tokenBodies[1]))).toEqual({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })

    // The new connection authenticates with the new token, then sends the spec subscribe again
    const authIndex = after().findIndex((m) => m.action === 'auth')
    const subscribeIndex = after().findIndex((m) => m.action === 'subscribe')
    expect(after()[authIndex]).toEqual({
      action: 'auth',
      key: 'access_token',
      secret: SECOND_ACCESS_TOKEN,
    })
    expect(subscribeIndex).toBeGreaterThan(authIndex)
    expect(after()[subscribeIndex]).toEqual(subscribeMessage('AAPL'))

    // The stream resumes on the new connection: a newer quote is served
    const resumedT = '2026-09-17T00:30:45Z'
    const resumed = { ...AAPL_QUOTE, bp: 200, bs: 3, ap: 202, as: 4, t: resumedT }
    pushFrames([resumed])
    await step()
    response = await testAdapter.request(exampleRequest)
    for (let i = 0; i < 10 && response.json().result !== 201; i++) {
      pushFrames([resumed])
      await step()
      response = await testAdapter.request(exampleRequest)
    }
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      result: 201,
      data: { mid_price: 201, bid_price: 200, bid_volume: 3, ask_price: 202, ask_volume: 4 },
      timestamps: { providerIndicatedTimeUnixMs: Date.parse(resumedT) },
    })
  })
})
