import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebSocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const stockData = {
    base: 'TSLA',
    transport: 'ws',
  }
  const stockOvernightData = {
    base: 'AAPL:USLF24',
    transport: 'ws',
  }
  const stockFreshData = {
    base: 'AMZN:USLF24',
    transport: 'ws',
  }
  const quoteData = {
    base: 'TSLA',
    endpoint: 'stock_quotes',
  }
  const quoteMulti1Data = {
    base: 'MULTI_1',
    endpoint: 'stock_quotes',
  }
  const quoteMulti2Data = {
    base: 'MULTI_2',
    endpoint: 'stock_quotes',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '10000'
    process.env['CACHE_MAX_AGE'] = '10000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with result
    await testAdapter.request(quoteData)
    await testAdapter.request(quoteMulti1Data)
    await testAdapter.request(quoteMulti2Data)
    await testAdapter.request(stockData)
    await testAdapter.request(stockOvernightData)
    await testAdapter.request(stockFreshData)
    await testAdapter.waitForCache(9)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(stockData)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return success - overnight', async () => {
      const response = await testAdapter.request(stockOvernightData)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return success - latest data', async () => {
      const response = await testAdapter.request(stockFreshData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('quote endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(quoteData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for 1st item in multi message', async () => {
      const response = await testAdapter.request(quoteMulti1Data)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for 2nd item in multi message', async () => {
      const response = await testAdapter.request(quoteMulti2Data)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return bid when ask is 0', async () => {
      const response = await testAdapter.request({
        base: 'NO_ASK',
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return ask when bid is 0', async () => {
      const response = await testAdapter.request({
        base: 'NO_BID',
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('error when data length is not valid', async () => {
      const response = await testAdapter.request({
        base: 'INVALID_DATA',
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
