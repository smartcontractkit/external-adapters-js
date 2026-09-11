import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'

// This adapter builds its endpoint by cloning the one exported from the coinmetrics package. The
// clone shares `requestTransforms` with the original, whose `symbolOverrider` is bound to an
// endpoint that never gets initialize()d — so unless the transform is rebound, every RDD override
// is dropped and the adapter subscribes to the un-overridden symbol. That failed silently in
// production: FRAX/USD subscribed to `frax` instead of `frax_frax`, which CoinMetrics only quotes
// intermittently, and MATIC/USD subscribed to `matic`, which it no longer quotes at all.
describe('crypto-lwba request overrides', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const wsEndpoint = 'ws://localhost:9091/v4/timeseries-stream/asset-quotes'

  // Every URL the adapter opened against the mocked provider, so we can assert on `assets=`.
  const connectedUrls: string[] = []

  const requestPayload = {
    endpoint: 'crypto',
    from: 'FRAX',
    to: 'USD',
    overrides: {
      'coinmetrics-lwba': {
        FRAX: 'frax_frax',
      },
    },
  }

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = new MockWebsocketServer(wsEndpoint, { mock: false })
    mockWsServer.on('connection', (socket) => {
      connectedUrls.push((socket as unknown as { url: string }).url)

      // Quote keyed on the overridden asset id, mirroring what CoinMetrics actually streams back.
      setTimeout(
        () =>
          socket.send(
            JSON.stringify({
              pair: 'frax_frax-usd',
              time: '2026-09-02T17:33:25.500000000Z',
              ask_price: '0.29185768012121305',
              ask_size: '3000.63',
              bid_price: '0.29127180836455296',
              bid_size: '1077.0100000000002',
              mid_price: '0.291564744242883',
              spread: '0.0020094053489951857',
              cm_sequence_id: '495',
            }),
          ),
        10,
      )
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { adapter } = require('../../src')
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
    })

    // Cold request to register the subscription and open the connection.
    await testAdapter.request(requestPayload)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('subscribes using the overridden asset id, not the requested one', () => {
    expect(connectedUrls.length).toBeGreaterThan(0)
    const subscribed = connectedUrls.join(' ')
    expect(subscribed).toContain('assets=frax_frax')
    expect(subscribed).not.toContain('assets=frax&')
    expect(subscribed).not.toMatch(/assets=frax$/)
  })

  it('resolves a price for the overridden symbol', async () => {
    const response = await testAdapter.request(requestPayload)
    expect(response.statusCode).toEqual(200)
    expect(response.json().data).toEqual({
      bid: 0.29127180836455296,
      mid: 0.291564744242883,
      ask: 0.29185768012121305,
    })
    expect(response.json().result).toEqual(0.291564744242883)
  })
})
