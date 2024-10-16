import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const priceData = {
    base: 'wsteth',
    quote: 'eth',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint + '/crypto-synth-state')

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(priceData)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto state endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(priceData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on empty data', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on empty base', async () => {
      const response = await testAdapter.request({ quote: 'ETH' })
      expect(response.statusCode).toEqual(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on empty quote', async () => {
      const response = await testAdapter.request({ base: 'wstETH' })
      expect(response.statusCode).toEqual(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on invalid pair', async () => {
      const response = await testAdapter.request({ base: 'ABC', quote: 'XYZ' })
      expect(response.statusCode).toEqual(504)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
