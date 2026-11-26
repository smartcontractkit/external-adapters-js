import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { InstalledClock } from '@sinonjs/fake-timers'
import { config } from '../../src/config'
import { mockMarkPriceWebsocketServer } from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter<SettingsDefinition>
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataMarkPrice = {
    exchange: 'binance',
    base: 'BTCUSDT',
    type: 'mark_price',
    endpoint: 'markprice',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockMarkPriceWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataMarkPrice)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  describe('markprice endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataMarkPrice)
      expect(response.json()).toMatchSnapshot()
    })

    it('should reject an invalid exchange', async () => {
      const response = await testAdapter.request({ ...dataMarkPrice, exchange: 'invalid' })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should reject an invalid type', async () => {
      const response = await testAdapter.request({ ...dataMarkPrice, type: 'invalid' })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
