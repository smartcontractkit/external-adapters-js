import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import * as nock from 'nock'
import {
  mockStockQuotesHttpFailure,
  mockStockQuotesHttpSuccess,
  mockStockQuotesWebSocketServer,
} from './fixtures'

describe('stock quotes', () => {
  let spy: jest.SpyInstance
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const wsEndpoint = 'ws://localhost:9094'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['STOCK_QUOTES_WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_SOCKET_KEY'] = 'fake-api-key'
    process.env['API_KEY'] = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockStockQuotesWebSocketServer(wsEndpoint)
    // Both nock mocks are persisted and remain active for the whole suite
    mockStockQuotesHttpSuccess()
    mockStockQuotesHttpFailure()

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    const clock = FakeTimers.install()
    spy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2022-01-01T11:11:11.111Z').getTime())
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock,
      testAdapter: {} as TestAdapter<never>,
    })

    // Seed the cache with both WS (5) and HTTP (2) responses
    await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL' })
    await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL_NUMBER' })
    await testAdapter.request({ endpoint: 'stock_quotes', base: 'FALLBACK' })
    await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL', transport: 'rest' })
    await testAdapter.request({ endpoint: 'stock_quotes', base: 'MSFT', transport: 'rest' })
    await testAdapter.waitForCache(7)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('http transport', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({
        endpoint: 'stock_quotes',
        base: 'AAPL',
        transport: 'rest',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid payload', async () => {
      const response = await testAdapter.request({
        endpoint: 'stock_quotes',
        base: 'MSFT',
        transport: 'rest',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('websocket transport', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL' })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for number messages', async () => {
      const response = await testAdapter.request({ endpoint: 'stock_quotes', base: 'AAPL_NUMBER' })
      expect(response.json()).toMatchSnapshot()
    })

    it('missing a and b fields should fallback', async () => {
      const response = await testAdapter.request({ endpoint: 'stock_quotes', base: 'FALLBACK' })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return bid when ask is 0', async () => {
      const response = await testAdapter.request({ base: 'NO_ASK', endpoint: 'stock_quotes' })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return ask when bid is 0', async () => {
      const response = await testAdapter.request({ base: 'NO_BID', endpoint: 'stock_quotes' })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
