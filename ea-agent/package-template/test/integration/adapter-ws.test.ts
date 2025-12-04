import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataPrice = {
    base: 'ETH',
    quote: 'USD',
    endpoint: 'price',
    transport: 'ws',
  }

  const dataReserve = {
    base: 'ETH',
    quote: 'USD',
    endpoint: 'reserve',
    transport: 'ws',
  }

  const dataNav = {
    base: 'ETH',
    quote: 'USD',
    endpoint: 'nav',
    transport: 'ws',
  }

  const dataLwba = {
    base: 'ETH',
    quote: 'USD',
    endpoint: 'lwba',
    transport: 'ws',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataPrice)
    await testAdapter.request(dataReserve)
    await testAdapter.request(dataNav)
    await testAdapter.request(dataLwba)
    await testAdapter.waitForCache(4)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataPrice)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('reserve endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataReserve)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataNav)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('lwba endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataLwba)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
