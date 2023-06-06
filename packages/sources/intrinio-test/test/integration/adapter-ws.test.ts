import { mockAuthResponse, mockWebSocketServer } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import FakeTimers from '@sinonjs/fake-timers'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

describe('price endpoint websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = `wss://realtime.intrinio.com/socket/websocket?vsn=1.0.0&token=fake-api-token`
  let oldEnv: NodeJS.ProcessEnv
  const data = {
    base: 'AAPL',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'

    mockAuthResponse()
    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(data)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('should return success', async () => {
    const response = await testAdapter.request(data)
    expect(response.json()).toMatchSnapshot({
      timestamps: {
        providerDataReceivedUnixMs: expect.any(Number),
        providerDataStreamEstablishedUnixMs: expect.any(Number),
      },
    })
  })
})
