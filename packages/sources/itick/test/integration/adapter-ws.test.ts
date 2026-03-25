import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const requests = [
    {
      symbol: '100',
      endpoint: 'hk-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'cn-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'indices-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'kr-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'jp-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'tw-depth',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'hk-quote',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'cn-quote',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'indices-quote',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'kr-quote',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'jp-quote',
      transport: 'ws',
    },
    {
      symbol: '100',
      endpoint: 'tw-quote',
      transport: 'ws',
    },
    {
      symbol: 'X700',
      endpoint: 'hk-depth',
      transport: 'ws',
      overrides: {
        itick: {
          X700: '700',
        },
      },
    },
  ]

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['REGIONS'] = 'hk'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY_HK'] = 'fake-api-key'
    process.env['API_KEY_CN'] = 'fake-api-key'
    process.env['API_KEY_GB'] = 'fake-api-key'
    process.env['API_KEY_KR'] = 'fake-api-key'
    process.env['API_KEY_JP'] = 'fake-api-key'
    process.env['API_KEY_TW'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint + '/stock')
    mockWsServer = mockWebsocketServer(wsEndpoint + '/indices')

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await Promise.all(requests.map((req) => testAdapter.request(req)))
    await testAdapter.waitForCache(requests.length)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('depth endpoint', () => {
    it('should return success', async () => {
      for (const request of requests) {
        const response = await testAdapter.request(request)
        expect(response.json()).toMatchSnapshot()
        expect(response.statusCode).toEqual(200)
      }
    })
  })
})
