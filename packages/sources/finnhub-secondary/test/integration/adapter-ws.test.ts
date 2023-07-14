import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  MockWebsocketServer,
  TestAdapter,
  mockWebSocketProvider,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

const mockWebSocketServer = (url: string) => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(
        JSON.stringify({
          data: [
            {
              c: null,
              p: 1.098455,
              s: 'OANDA:EUR_USD',
              t: 1641035471111,
              v: 0,
            },
          ],
          type: 'trade',
        }),
      )
    })
  })
  return mockWsServer
}

describe('websocket', () => {
  const wsEndpoint = 'wss://ws.finnhub.io'

  const data = {
    base: 'OANDA:EUR_USD',
  }

  let spy: jest.SpyInstance
  let oldEnv: NodeJS.ProcessEnv
  let mockWsServer: MockWebsocketServer
  let testAdapter: TestAdapter

  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    process.env['WS_ENABLED'] = 'true'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
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
    await testAdapter.api.close()
    mockWsServer?.close()
    spy.mockRestore()
  })

  it('should return success for full symbols', async () => {
    const response = await testAdapter.request({
      base: 'OANDA:EUR_USD',
    })

    expect(response.json()).toMatchSnapshot()
  })

  it('should return success for base overriden by default adapter overrides', async () => {
    const response = await testAdapter.request({
      base: 'EUR',
    })

    expect(response.json()).toMatchSnapshot()
  })

  it('should return success for requests with base and quote', async () => {
    const response = await testAdapter.request({
      base: 'EUR',
      quote: 'USD',
    })

    expect(response.json()).toMatchSnapshot()
  })
})
