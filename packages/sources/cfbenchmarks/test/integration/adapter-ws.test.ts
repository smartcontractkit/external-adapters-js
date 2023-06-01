import { Server } from 'mock-socket'
import { mockWebSocketServer, mockWebSocketProvider } from './fixtures'
import { TestAdapter, setEnvVariables } from '@chainlink/external-adapter-framework/util/test-util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import FakeTimers from '@sinonjs/fake-timers'
describe('websocket', () => {
  let mockWsServer: Server | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'

  let oldEnv: NodeJS.ProcessEnv

  const dataCrypto = {
    index: 'BRTI',
  }

  const dataLwba = {
    index: 'U_ETHUSD_RTI',
    endpoint: 'cryptolwba',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'
    process.env['BIRC_RETRY'] = '0'
    process.env['BIRC_RETRY_DELAY_MS'] = '10'

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
    await testAdapter.request(dataLwba)
    await testAdapter.waitForCache(2)
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
