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

  const dataPriceGMCI30 = {
    index: 'GMCI30',
  }

  const dataPriceGML2 = {
    index: 'GML2',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Prime the cache for GMCI30
    await testAdapter.request(dataPriceGMCI30)
    await testAdapter.waitForCache(1)

    // Prime the cache for GML2
    await testAdapter.request(dataPriceGML2)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('should return success for GMCI30', async () => {
      const response = await testAdapter.request(dataPriceGMCI30)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for GML2', async () => {
      const response = await testAdapter.request(dataPriceGML2)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
