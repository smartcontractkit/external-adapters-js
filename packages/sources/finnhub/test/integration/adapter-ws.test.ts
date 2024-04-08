import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  MockWebsocketServer,
  TestAdapter,
  mockWebSocketProvider,
  setEnvVariables,
  runAllUntilTime,
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
              s: 'FHFX:EUR-USD',
              t: 1641035471111,
              v: 0,
            },
            {
              c: null,
              p: 142.652,
              s: 'FHFX:USD-JPY',
              t: 1641035471111,
              v: 0,
            },
          ],
          type: 'trade',
        }),
      )
      setTimeout(() => {
        socket.send(JSON.stringify({ type: 'ping' }))
      }, 10000)
    })
  })
  return mockWsServer
}

describe('websocket', () => {
  const wsEndpoint = 'wss://ws.finnhub.io'

  const data = {
    base: 'FHFX:EUR-USD',
    endpoint: 'forex',
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
      base: 'FHFX:EUR-USD',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success for requests with base and quote', async () => {
    const response = await testAdapter.request({
      base: 'EUR',
      quote: 'USD',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success for standard pairs, when pair has inverse config', async () => {
    const response = await testAdapter.request({
      base: 'USD',
      quote: 'JPY',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success for inverted pairs', async () => {
    const response = await testAdapter.request({
      base: 'JPY',
      quote: 'USD',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should update the ttl of forex params after heartbeat is received', async () => {
    await runAllUntilTime(testAdapter.clock, 93000)
    const expiredCacheResponse = await testAdapter.request({ base: 'EUR', quote: 'USD' })
    expect(expiredCacheResponse.statusCode).toBe(504)

    // The cache ttl is 90 seconds. Mocked heartbeat message is sent after 10s after connection which should
    // update the ttl and therefore after 93 seconds (from the initial message) we can access the asset
    const response = await testAdapter.request(data)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })
})
