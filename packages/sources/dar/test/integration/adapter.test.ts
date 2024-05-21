import { mockPriceWebSocketServer, mockTokenResponse } from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

describe('Price Endpoint', () => {
  let spy: jest.SpyInstance
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const tokenEndpoint = process.env.API_ENDPOINT || 'https://test-url.com'
  const wsEndpoint = process.env.WS_API_ENDPOINT || 'ws://localhost:9090'
  const data = {
    base: 'ETH',
    quote: 'USD',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_ENDPOINT'] = tokenEndpoint
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_API_KEY'] = 'test-key'
    process.env['WS_API_USERNAME'] = 'test-user'
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockTokenResponse()
    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockPriceWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(data)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    spy.mockRestore()
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

  it('should return error (empty data)', async () => {
    const response = await testAdapter.request({})
    expect(response.statusCode).toEqual(400)
  }, 30000)

  it('should return error (empty base)', async () => {
    const response = await testAdapter.request({ quote: 'BTC' })
    expect(response.statusCode).toEqual(400)
  })

  it('should return error (empty quote)', async () => {
    const response = await testAdapter.request({ base: 'ETH' })
    expect(response.statusCode).toEqual(400)
  }, 30000)

  it('should return error (not subscribed asset)', async () => {
    const response = await testAdapter.request({ base: 'BTC', quote: 'USD' })
    expect(response.statusCode).toEqual(504)
  }, 30000)
})
