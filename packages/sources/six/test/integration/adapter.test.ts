import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebSocketServer } from './fixtures'

describe('SIX Adapter', () => {
  let oldEnv: NodeJS.ProcessEnv
  let mockWsServer: MockWebsocketServer
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['TLS_PUBLIC_KEY'] = Buffer.from('mock-cert').toString('base64')
    process.env['TLS_PRIVATE_KEY'] = Buffer.from('mock-key').toString('base64')
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_SUBSCRIPTION_UNRESPONSIVE_TTL'] = '30000'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Prime subscriptions so the background loop establishes WS and populates cache
    await testAdapter.request({ ticker: 'ANA', bc: '1058' })
    await testAdapter.request({ ticker: 'ABBN', bc: '4' })
    await testAdapter.request({ ticker: 'STALE', bc: '999' })
    await testAdapter.waitForCache(3)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('should return success for entitled BME instrument', async () => {
      const response = await testAdapter.request({
        ticker: 'ANA',
        bc: '1058',
      })

      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.statusCode).toBe(200)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('result')

      const d = body.data
      expect(typeof d.bid).toBe('number')
      expect(typeof d.ask).toBe('number')
      expect(typeof d.lastTradedPrice).toBe('number')
      expect(typeof d.volume).toBe('number')
      expect(d.ripcord).toBe(false)
      expect(d.ripcordAsInt).toBe(0)

      expect(d.bid).toBe(230.8)
      expect(d.ask).toBe(231.6)
      expect(d.lastTradedPrice).toBe(231.6)
      expect(d.mid).toBe(231.2)
      expect(d.volume).toBe(53750.0)
    })

    it('should return ripcord error for non-entitled instrument', async () => {
      const response = await testAdapter.request({
        ticker: 'ABBN',
        bc: '4',
      })

      const body = response.json()
      expect(body.statusCode).toBe(502)
      expect(body.errorMessage).toContain('Ripcord activated for ABBN_4')
      expect(body.errorMessage).toContain('SIX stream error')
    })

    it('should return ripcord for stale data', async () => {
      const response = await testAdapter.request({
        ticker: 'STALE',
        bc: '999',
      })

      const body = response.json()
      expect(body.statusCode).toBe(502)
      expect(body.errorMessage).toContain('Ripcord activated for STALE_999')
      expect(body.errorMessage).toContain('Stale data')
    })

    it('should work with alias parameters', async () => {
      const response = await testAdapter.request({
        symbol: 'ANA',
        market: '1058',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.lastTradedPrice).toBe(231.6)
    })
  })
})
