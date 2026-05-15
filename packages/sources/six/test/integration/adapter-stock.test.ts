import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockSixStockWebSocketServer } from './stock-fixtures'

describe('execute', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const normalRequest = { base: 'happy_market' }
  const lastonlyRequest = { base: 'last_only' }
  const bidaskonlyRequest = { base: 'bidask_only' }
  const errorRequest = { base: 'error_market' }
  const bidUpdateRequest = { base: 'bid_update' }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\nfake-private-key\n-----END PRIVATE KEY-----'
    process.env.PUBLIC_CERT =
      '-----BEGIN CERTIFICATE-----\nfake-public-cert\n-----END CERTIFICATE-----'
    process.env.WS_API_ENDPOINT = wsEndpoint

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockSixStockWebSocketServer(wsEndpoint)

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({
        // To make TestAdapter.waitUntilResolved / waitForCache work with clock.nextAsync
        toNotFake: ['nextTick', 'queueMicrotask'],
      }),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(normalRequest) // 2 cache
    await testAdapter.request(lastonlyRequest) // 1 cache
    await testAdapter.request(bidaskonlyRequest) // 1 cache
    await testAdapter.request(errorRequest) // 0 cache
    await testAdapter.request(bidUpdateRequest) //1 cache
    await testAdapter.waitForCache(5)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock endpoint - invalid base', () => {
    it('stock fail', async () => {
      expect((await testAdapter.request({ base: 'lol' })).json()).toMatchSnapshot()
    })
  })

  describe('stock endpoint - happy path', () => {
    it('stock pass', async () => {
      expect((await testAdapter.request(normalRequest)).json()).toMatchSnapshot()
    })
    it('stock_quotes pass', async () => {
      const response = await testAdapter.request({
        ...normalRequest,
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock endpoint - last only', () => {
    it('stock pass', async () => {
      expect((await testAdapter.request(lastonlyRequest)).json()).toMatchSnapshot()
    })
    it('stock_quotes fail', async () => {
      const response = await testAdapter.request({
        ...lastonlyRequest,
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock endpoint - bid ask only', () => {
    it('stock fail', async () => {
      expect((await testAdapter.request(bidaskonlyRequest)).json()).toMatchSnapshot()
    })
    it('stock_quotes pass', async () => {
      const response = await testAdapter.request({
        ...bidaskonlyRequest,
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock endpoint - bid update', () => {
    it('stock_quotes pass', async () => {
      const response = await testAdapter.request({
        ...bidUpdateRequest,
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
