import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

import {
  mockCryptoWebSocketServer,
  mockForexContinuousWebSocketServer,
  mockForexResponse,
  mockForexWebSocketServer,
  mockMarketStatusWebSocketServer,
} from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let mockWsServerForex: MockWebsocketServer | undefined
  let mockWsServerForexContinuous: MockWebsocketServer | undefined
  let forexContinuousConnectionSubscriptions: Set<string>[] = []
  let mockWsServerMarketStatus: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  const wsEndpointForex = 'ws://localhost:9091'
  const wsEndpointMarketStatus = 'ws://localhost:9092'
  const wsEndpointForexContinuous = 'ws://localhost:9093'
  let oldEnv: NodeJS.ProcessEnv
  const cryptoData = {
    base: 'eth',
    quote: 'usd',
  }
  const cryptoDataLwba = {
    endpoint: 'crypto-lwba',
    base: 'avax',
    quote: 'usd',
  }
  const cryptoDataLwbaInvariantViolation = {
    endpoint: 'crypto-lwba',
    base: 'btc',
    quote: 'usd',
  }
  const forexData = {
    base: 'CAD',
    quote: 'USD',
    endpoint: 'forex',
  }
  const forexContinuousData = {
    base: 'ARS',
    quote: 'USD',
    endpoint: 'forex-continuous',
  }
  const forexContinuousInverseData = {
    from: 'USD',
    to: 'ARS',
    endpoint: 'forex-continuous',
  }
  const marketStatusOpenData = {
    market: 'forex',
    endpoint: 'market-status',
  }
  const marketStatusClosedData = {
    market: 'metals',
    endpoint: 'market-status',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['FOREX_WS_API_ENDPOINT'] = wsEndpointForex
    process.env['MARKET_STATUS_WS_API_ENDPOINT'] = wsEndpointMarketStatus
    process.env['FOREX_CONTINUOUS_WS_API_ENDPOINT'] = wsEndpointForexContinuous
    process.env['API_USERNAME'] = 'test-api-username'
    process.env['API_PASSWORD'] = 'test-api-password'
    process.env['FOREX_WS_API_KEY'] = 'test-api-key'
    process.env['MARKET_STATUS_WS_API_KEY'] = 'test-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockCryptoWebSocketServer(wsEndpoint)
    mockWsServerForex = mockForexWebSocketServer(wsEndpointForex)
    mockWsServerMarketStatus = mockMarketStatusWebSocketServer(wsEndpointMarketStatus)
    const forexContinuousMock = mockForexContinuousWebSocketServer(wsEndpointForexContinuous)
    mockWsServerForexContinuous = forexContinuousMock.server
    forexContinuousConnectionSubscriptions = forexContinuousMock.connectionSubscriptions

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(cryptoData)
    await testAdapter.request(cryptoDataLwba)
    await testAdapter.request(cryptoDataLwbaInvariantViolation)
    await testAdapter.request(forexData)
    await testAdapter.request(forexContinuousData)
    await testAdapter.request(forexContinuousInverseData)
    await testAdapter.request(marketStatusOpenData)
    await testAdapter.request(marketStatusClosedData)
    await testAdapter.waitForCache(8 + Object.keys(mockForexResponse).length)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    mockWsServerForex?.close()
    mockWsServerForexContinuous?.close()
    mockWsServerMarketStatus?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(cryptoData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('lwba endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(cryptoDataLwba)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (LWBA invariant violation)', async () => {
      const response = await testAdapter.request(cryptoDataLwbaInvariantViolation)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(forexData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('forex-continuous endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(forexContinuousData)
      expect(response.json()).toMatchSnapshot()
    })

    // NCFX drops a pair's inverse on the same connection, so both directions
    // must be live at once, each on its own connection, and neither inverted on our side.
    it('should serve a pair and its inverse concurrently', async () => {
      const forward = await testAdapter.request(forexContinuousData)
      const inverse = await testAdapter.request(forexContinuousInverseData)

      expect(forward.statusCode).toEqual(200)
      expect(inverse.statusCode).toEqual(200)
      expect(forward.json().data).toEqual({ bid: 0.000659191, mid: 0.000659222, ask: 0.000659234 })
      expect(inverse.json().data).toEqual({ bid: 1516.9, mid: 1516.94, ask: 1516.98 })

      const liveSubscriptions = forexContinuousConnectionSubscriptions.flatMap((subs) => [...subs])
      expect(liveSubscriptions).toEqual(expect.arrayContaining(['ARS-USD', 'USD-ARS']))
      for (const subs of forexContinuousConnectionSubscriptions) {
        expect(subs.has('ARS-USD') && subs.has('USD-ARS')).toBe(false)
      }
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({ endpoint: 'forex-continuous' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ endpoint: 'forex-continuous', quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ endpoint: 'forex-continuous', base: 'ARS' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('market status endpoint', () => {
    it('should return success with open', async () => {
      const response = await testAdapter.request(marketStatusOpenData)
      expect(response.statusCode).toEqual(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with closed', async () => {
      const response = await testAdapter.request(marketStatusClosedData)
      expect(response.statusCode).toEqual(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty market)', async () => {
      const response = await testAdapter.request({ ...marketStatusOpenData, market: undefined })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (unknown market)', async () => {
      const response = await testAdapter.request({ ...marketStatusOpenData, market: 'unknown' })
      expect(response.statusCode).toEqual(400)
    })
  })
})
