import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebSocketServer } from './fixtures'

describe('execute', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  const wsEndpoint = 'ws://localhost:9090'

  const v3Data = {
    feedId: '0x0003',
  }
  const v8Data = {
    endpoint: 'rwa-v8',
    feedId: '0x0008',
  }

  const v11Data = {
    endpoint: 'deutscheBoerse-v11',
    feedId: '0x000b5',
  }

  const v3WithResultPath = {
    feedId: '0x0003',
    resultPath: 'price',
  }

  const v3WithResultPathAndDecimals = {
    feedId: '0x0003',
    resultPath: 'bid',
    decimals: 8,
  }

  const v8WithResultPath = {
    endpoint: 'rwa-v8',
    feedId: '0x0008',
    resultPath: 'midPrice',
  }

  const v11WithResultPathAndDecimals = {
    endpoint: 'deutscheBoerse-v11',
    feedId: '0x000b5',
    resultPath: 'mid',
    decimals: 8,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_API_ENDPOINT = wsEndpoint
    process.env.API_USERNAME = 'fake-username'
    process.env.API_PASSWORD = 'fake-password'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial requests to start background execute and wait for cache to be filled with results.
    // Base requests (no resultPath/decimals)
    await testAdapter.request(v3Data)
    await testAdapter.request(v8Data)
    await testAdapter.request(v11Data)
    // Requests with resultPath and/or decimals
    await testAdapter.request(v3WithResultPath)
    await testAdapter.request(v3WithResultPathAndDecimals)
    await testAdapter.request(v8WithResultPath)
    await testAdapter.request(v11WithResultPathAndDecimals)
    await testAdapter.waitForCache(7)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('crypto-v3 endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(v3Data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('rwa-v8 endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(v8Data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('deutscheBoerse-v11 endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(v11Data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto-v3 with resultPath', () => {
    it('should return price in result field', async () => {
      const response = await testAdapter.request(v3WithResultPath)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.result).toBe('120950127609218450000000')
      expect(json.data.price).toBe('120950127609218450000000')
      expect(json.data.bid).toBeDefined()
      expect(json.data.ask).toBeDefined()
    })
  })

  describe('crypto-v3 with resultPath and decimals', () => {
    it('should return scaled bid in result field', async () => {
      const response = await testAdapter.request(v3WithResultPathAndDecimals)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      // bid 120945968265543240000000 scaled from 18 to 8 decimals
      expect(json.result).toBe('12094596826554')
      // data should still contain raw unscaled values
      expect(json.data.bid).toBe('120945968265543240000000')
    })
  })

  describe('rwa-v8 with resultPath', () => {
    it('should return midPrice in result field', async () => {
      const response = await testAdapter.request(v8WithResultPath)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.result).toBe('609515000000000000000')
      expect(json.data.midPrice).toBe('609515000000000000000')
    })
  })

  describe('deutscheBoerse-v11 with resultPath and decimals', () => {
    it('should return scaled mid in result field', async () => {
      const response = await testAdapter.request(v11WithResultPathAndDecimals)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      // mid 225325000000000000000 scaled from 18 to 8 decimals
      expect(json.result).toBe('22532500000')
      // data should still contain raw unscaled values
      expect(json.data.mid).toBe('225325000000000000000')
    })
  })
})
