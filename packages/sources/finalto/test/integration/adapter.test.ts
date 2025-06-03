import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataForex = {
    base: 'GBP',
    quote: 'USD',
    endpoint: 'forex',
  }

  const dataStock = {
    base: 'AAPL.xnas',
    quote: 'USD',
    endpoint: 'stock',
  }

  const dataStockWithOverride = {
    base: 'MSFT',
    quote: 'USD',
    overrides: {
      finalto: {
        MSFT: 'MSFT.xnas',
      },
    },
    endpoint: 'stock',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_API_USERNAME'] = 'fake-username'
    process.env['WS_API_PASSWORD'] = 'fake-password'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(dataForex)
    await testAdapter.request(dataStock)
    await testAdapter.request(dataStockWithOverride)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataForex)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'EUR' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('stock endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataStock)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with base override', async () => {
      const response = await testAdapter.request(dataStockWithOverride)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
