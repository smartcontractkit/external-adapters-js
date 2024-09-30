import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockSubscriptionsResponse,
  mockSubscribeError,
  mockSubscribeResponse,
  mockWebSocketServer,
} from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const apiKey: string = process.env['API_KEY'] ?? 'test-api-key'
  const data = {
    base: 'ETH',
    quote: 'USD',
  }
  const dataLWBA = {
    endpoint: 'crypto-lwba',
    base: 'AVAX',
    quote: 'USD',
  }
  const dataLWBAInvariantViolation = {
    endpoint: 'crypto-lwba',
    base: 'BTC',
    quote: 'USD',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = apiKey
    process.env['METRICS_ENABLED'] = 'false'
    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWebSocketServer(`wss://api.chk.elwood.systems/v1/stream?apiKey${process.env['API_KEY']}`)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    nock.cleanAll()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      mockSubscriptionsResponse(apiKey, [])
      const scope = mockSubscribeResponse(apiKey, `${data.base}-${data.quote}`)
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(scope.isDone()).toEqual(true)
    })

    it('should skip subscribing if already subscribed', async () => {
      mockSubscriptionsResponse(apiKey, [`${data.base}-${data.quote}`])
      const scope = mockSubscribeResponse(apiKey, `${data.base}-${data.quote}`)
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(scope.isDone()).toEqual(false)
    })

    it('should return success (LWBA)', async () => {
      mockSubscriptionsResponse(apiKey, [])
      const scope = mockSubscribeResponse(apiKey, `${dataLWBA.base}-${dataLWBA.quote}`)
      const response = await testAdapter.request(dataLWBA)
      expect(response.json()).toMatchSnapshot()
      expect(scope.isDone()).toEqual(true)
    })

    it('should skip subscribing if already subscribed (LWBA)', async () => {
      mockSubscriptionsResponse(apiKey, [`${dataLWBA.base}-${dataLWBA.quote}`])
      const scope = mockSubscribeResponse(apiKey, `${dataLWBA.base}-${dataLWBA.quote}`)
      const response = await testAdapter.request(dataLWBA)
      expect(response.json()).toMatchSnapshot()
      expect(scope.isDone()).toEqual(false)
    })

    it('should return error (LWBA invariant violation)', async () => {
      mockSubscriptionsResponse(apiKey, [])
      mockSubscribeResponse(
        apiKey,
        `${dataLWBAInvariantViolation.base}-${dataLWBAInvariantViolation.quote}`,
      )
      const response = await testAdapter.request(dataLWBAInvariantViolation)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return cached subscribe error', async () => {
      const data = {
        base: 'XXX',
        quote: 'USD',
      }
      mockSubscriptionsResponse(apiKey, [])
      mockSubscribeError(apiKey, `${data.base}-${data.quote}`)
      await testAdapter.request(data)
      await testAdapter.waitForCache()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot({
        timestamps: {
          providerDataReceivedUnixMs: expect.any(Number),
          providerDataStreamEstablishedUnixMs: expect.any(Number),
        },
      })
    })
  })
})
