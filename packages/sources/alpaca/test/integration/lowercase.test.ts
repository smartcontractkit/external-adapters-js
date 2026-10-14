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
  CLIENT_ID,
  CLIENT_SECRET,
  WS_API_ENDPOINT,
  mockTokenResponse,
  mockWebsocketServer,
} from './fixtures'

// Captured before FakeTimers.install replaces the global
const realSetTimeout = setTimeout

// A fresh adapter, so the lowercase request is the first and only subscription for the symbol.
// Alpaca frames carry the uppercase symbol (spec sample_response S: "AAPL"), and the mock server
// answers only an uppercase AAPL subscribe with the spec quote frame.
describe('stock_quotes lowercase base', () => {
  let testAdapter: TestAdapter
  let mockWsServer: MockWebsocketServer | undefined
  let oldEnv: NodeJS.ProcessEnv
  const received: { action?: string; quotes?: string[] }[] = []

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CLIENT_ID'] = CLIENT_ID
    process.env['CLIENT_SECRET'] = CLIENT_SECRET
    delete process.env['AUTH_ENDPOINT']
    delete process.env['WS_API_ENDPOINT']

    mockTokenResponse()
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(WS_API_ENDPOINT, received)

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

  it('lowercase base aapl returns the AAPL quote', async () => {
    const request = { from: 'aapl', to: 'USD' }
    let response = await testAdapter.request(request)
    for (let i = 0; i < 10 && response.statusCode !== 200; i++) {
      // nock replies on a real timer, so each step also yields real time
      await testAdapter.clock.tickAsync(1000)
      await new Promise((resolve) => realSetTimeout(resolve, 10))
      response = await testAdapter.request(request)
    }

    const subscribed = received.filter((m) => m.action === 'subscribe').flatMap((m) => m.quotes)
    expect(subscribed).toContain('AAPL')
    expect(subscribed).not.toContain('aapl')

    // Spec endpoint_request_response_examples[0]
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.result).toBe(190.0)
    expect(body.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.95,
      bid_volume: 1,
      ask_price: 190.05,
      ask_volume: 2,
    })
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1789605015123)
  })
})
