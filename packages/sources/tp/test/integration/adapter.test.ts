import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  TestAdapter,
  setEnvVariables,
  mockWebSocketProvider,
  MockWebsocketServer,
  runAllUntilTime,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockPriceWebSocketServer } from './fixtures'

describe('Price Endpoint', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv
  const data = {
    base: 'EUR',
    quote: 'USD',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_USERNAME'] = 'test-username'
    process.env['WS_API_PASSWORD'] = 'test-password'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_SUBSCRIPTION_UNRESPONSIVE_TTL'] = '180000'

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
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('should return price', async () => {
    const response = await testAdapter.request({ base: 'EUR', quote: 'USD' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return price for inverse pair', async () => {
    const response = await testAdapter.request({ base: 'IDR', quote: 'USD' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return price for specific source', async () => {
    const response = await testAdapter.request({ base: 'EUR', quote: 'USD', tpSource: 'FYI' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return price for overridden symbol', async () => {
    const response = await testAdapter.request({
      base: 'ZZZ',
      quote: 'USD',
      overrides: { tp: { ZZZ: 'FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!TP' } },
    })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return price for mapped symbol', async () => {
    const response = await testAdapter.request({ base: 'WTI', quote: 'USD', tpSource: 'LDN' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return price for overridden mapped symbol', async () => {
    const response = await testAdapter.request({
      base: 'ZZZ',
      quote: 'USD',
      tpSource: 'LDN',
      overrides: { tp: { ZZZ: 'CEOILOTRWTSBOM:LDN.BIL.QTE.RTM!TP' } },
    })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error when queried for IC price', async () => {
    const response = await testAdapter.request({ base: 'ABC', quote: 'USD' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error when queried for stale price', async () => {
    const response = await testAdapter.request({ base: 'JPY', quote: 'USD' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error on empty data', async () => {
    const response = await testAdapter.request({})
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error on empty base', async () => {
    const response = await testAdapter.request({ quote: 'USD' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return error on empty quote', async () => {
    const response = await testAdapter.request({ base: 'EUR' })
    expect(response.json()).toMatchSnapshot()
  })

  it('should update the ttl after heartbeat is received', async () => {
    // The cache tll is 90 seconds. Mocked heartbeat message is sent after 10s after connection which should
    // update the ttl and therefore after 91 seconds (from the initial message) we can access the asset
    await runAllUntilTime(testAdapter.clock, 91000)
    const response = await testAdapter.request({ base: 'EUR', quote: 'USD' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })
})
