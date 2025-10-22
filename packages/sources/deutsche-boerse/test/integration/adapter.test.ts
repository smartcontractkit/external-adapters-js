import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer, STREAM, TEST_ISIN } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsBase = 'ws://localhost:9090'
  const wsFull = `${wsBase}/stream?format=proto`
  let oldEnv: NodeJS.ProcessEnv

  const dataLwba = {
    isin: TEST_ISIN,
    market: STREAM,
  }

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.WS_API_ENDPOINT = wsBase
    process.env.API_KEY = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsFull)

    const { adapter } = await import('./../../src')
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(dataLwba)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('lwba endpoint', () => {
    it('returns success and exposes bid/ask/mid fields', async () => {
      const response = await testAdapter.request(dataLwba)
      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.statusCode).toBe(200)
      expect(body).toHaveProperty('data')
      const d = body.data
      expect(d).toHaveProperty('bid')
      expect(d).toHaveProperty('ask')
      expect(d).toHaveProperty('mid')
      expect(d).toHaveProperty('bidSize')
      expect(d).toHaveProperty('askSize')
      expect(typeof d.bid).toBe('number')
      expect(typeof d.ask).toBe('number')
      expect(typeof d.mid).toBe('number')
      expect(typeof d.bidSize).toBe('number')
      expect(typeof d.askSize).toBe('number')
      expect(body).toMatchSnapshot()
    })
  })

  describe('price endpoint', () => {
    it('returns success and exposes latestPrice', async () => {
      const dataPrice = {
        ...dataLwba,
        endpoint: 'price',
      }
      const response = await testAdapter.request(dataPrice)
      const body = response.json()

      expect(response.statusCode).toBe(200)
      expect(body.statusCode).toBe(200)
      expect(body).toHaveProperty('data')
      const d = body.data
      expect(d).toHaveProperty('latestPrice')
      expect(typeof d.latestPrice).toBe('number')
      expect(body).toMatchSnapshot()
    })
  })
})
