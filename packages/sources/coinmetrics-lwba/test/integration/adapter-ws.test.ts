import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockCryptoLwbaWebSocketServer } from './fixtures'

describe('crypto-lwba websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const wsEndpoint = 'ws://localhost:9090/v4/timeseries-stream/asset-quotes'

  const requestPayload = {
    endpoint: 'crypto-lwba',
    base: 'ETH',
    quote: 'USD',
  }

  beforeAll(async () => {
    // snapshot current env and set the ones we need for tests
    oldEnv = { ...process.env }
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint

    // mock WS provider + server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockCryptoLwbaWebSocketServer(wsEndpoint)

    // start adapter with fake timers
    const { adapter } = await import('./../../src')
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
    })

    // warm the cache once so background execute starts
    await testAdapter.request(requestPayload)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('happy path', () => {
    it('returns a successful response', async () => {
      const response = await testAdapter.request(requestPayload)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('validation errors', () => {
    it('fails on empty body', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('fails on empty data', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba' })
      expect(response.statusCode).toEqual(400)
    })

    it('fails on missing base', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba', quote: 'USD' })
      expect(response.statusCode).toEqual(400)
    })

    it('fails on missing quote', async () => {
      const response = await testAdapter.request({ endpoint: 'crypto-lwba', base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('invariant violation handling', () => {
    it('handles a violation payload from the stream', async () => {
      // advance the fake clock so the mocked server pushes the next message
      testAdapter.clock.tick(1000)
      const response = await testAdapter.request(requestPayload)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
