import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebSocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv
  const dataCrypto = {
    index: 'BRTI',
  }
  const dataCryptoOverride = {
    base: 'ABC',
    quote: 'XXX',
    overrides: {
      cfbenchmarks: {
        ABC: 'BRTI',
      },
    },
  }
  const dataLwba = {
    from: 'ETH',
    quote: 'USD',
    endpoint: 'cryptolwba',
  }
  const dataLwbaInvariantViolation = {
    from: 'BTC',
    quote: 'USD',
    endpoint: 'cryptolwba',
  }
  const dataLwbaOverride = {
    endpoint: 'cryptolwba',
    base: 'LINK',
    quote: 'XXX',
    overrides: {
      cfbenchmarks: {
        LINK: 'U_LINKUSD_CHA_RTI',
      },
    },
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(dataCrypto)
    await testAdapter.request(dataCryptoOverride)
    await testAdapter.request(dataLwba)
    await testAdapter.request(dataLwbaOverride)
    await testAdapter.request(dataLwbaInvariantViolation)
    await testAdapter.waitForCache(4)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataCrypto)
      expect(response.json()).toMatchSnapshot()
    })

    it('with override should return success', async () => {
      const response = await testAdapter.request(dataCryptoOverride)
      expect(response.statusCode).toEqual(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto input validation', () => {
    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('lwba endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataLwba)
      expect(response.json()).toMatchSnapshot()
    })

    it('with override should return success', async () => {
      const response = await testAdapter.request(dataLwbaOverride)
      expect(response.statusCode).toEqual(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error (LWBA violation)', async () => {
      const response = await testAdapter.request(dataLwbaInvariantViolation)
      // ea-framework 2.19.1 rejects invariant-violating quotes in LwbaEndpoint.resultValidator, at
      // cache-write time, so the cached entry is a 502 rather than a 500 thrown on the read path.
      expect(response.statusCode).toEqual(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('lwba input validation', () => {
    it('should return error (empty data)', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty base)', async () => {
      const response = await testAdapter.request({ quote: 'BTC' })
      expect(response.statusCode).toEqual(400)
    })

    it('should return error (empty quote)', async () => {
      const response = await testAdapter.request({ base: 'ETH' })
      expect(response.statusCode).toEqual(400)
    })
  })
})
