import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServerMultiPair } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'wss://nobi.invalid/api/ws'
  let oldEnv: NodeJS.ProcessEnv

  const msolUsd = {
    base: 'MSOL',
    quote: 'USD',
    endpoint: 'price',
  }
  const btcUsd = {
    base: 'BTC',
    quote: 'USD',
    endpoint: 'price',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServerMultiPair(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(msolUsd)
    await testAdapter.request(btcUsd)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint - MSOL/USD', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(msolUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(111.96373354894808)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('price endpoint - BTC/USD', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(btcUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(71282.06887230572)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
