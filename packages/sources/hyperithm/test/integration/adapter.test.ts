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
import { mockWebsocketServer } from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter<SettingsDefinition>
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataStockQuotes = {
    base: '700/HKD',
    endpoint: 'stock_quotes',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    const API_KEY = 'fake-api-key'
    process.env['API_KEY'] = API_KEY
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(`${wsEndpoint}/0?token=${API_KEY}`)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataStockQuotes)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataStockQuotes)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
