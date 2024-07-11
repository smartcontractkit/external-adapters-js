import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { mockTokenSuccess, mockWebSocketServer } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

describe('websocket', () => {
  let spy: jest.SpyInstance
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const wsEndpoint = 'ws://localhost:9090'
  const data = {
    base: 'ETH',
    quote: 'USD',
  }
  const lwbaData = {
    base: 'ETH',
    quote: 'USD',
    endpoint: 'crypto-lwba',
  }
  const lwbaDataInvariantViolation = {
    base: 'BTC',
    quote: 'USD',
    endpoint: 'crypto-lwba',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = process.env['WS_USER_ID'] || 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = process.env['WS_PUBLIC_KEY'] || 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = process.env['WS_PRIVATE_KEY'] || 'test-priv-key'
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockTokenSuccess()
    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

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

  describe('websocket endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot({
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataStreamEstablishedUnixMs: expect.any(Number),
        },
      })
    })

    it('lwba endpoint should return success', async () => {
      const response = await testAdapter.request(lwbaData)
      expect(response.json()).toMatchSnapshot({
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataStreamEstablishedUnixMs: expect.any(Number),
        },
      })
    })

    it('lwba endpoint should return error (invariant violation)', async () => {
      const response = await testAdapter.request(lwbaDataInvariantViolation)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })
})
