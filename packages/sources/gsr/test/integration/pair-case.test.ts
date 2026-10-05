import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockTokenSuccess } from './fixtures'

const realSetTimeout = globalThis.setTimeout
const realYield = () => new Promise<void>((resolve) => realSetTimeout(resolve, 5))

// DF-26076: callers ask for the same pair with different capitalisation. Those
// requests share one subscription-set entry, because the cache key that keys it
// lowercases everything - but the entry stores the raw params, and the
// streaming transport compares subscriptions with JSON.stringify. Without
// normalisation each new spelling overwrites the stored value and the next
// background pass reads it as one stale plus one new subscription for a wire
// symbol that never stopped being wanted, so the adapter unsubscribes and
// resubscribes a live feed indefinitely.
describe('pair capitalisation', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let clock: FakeTimers.InstalledClock
  let oldEnv: NodeJS.ProcessEnv
  const framesReceived: string[] = []
  const wsEndpoint = 'ws://localhost:9094'

  const tickerFrame = () =>
    JSON.stringify({
      type: 'ticker',
      data: {
        symbol: 'ETH.USD',
        price: 1234,
        bidPrice: 1233,
        askPrice: 1235,
        ts: Date.now() * 1e6,
      },
    })

  const actionsFor = (symbol: string) =>
    framesReceived
      .map((frame) => JSON.parse(frame))
      .filter((parsed) => parsed.symbols?.includes(symbol))
      .map((parsed) => parsed.action)

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = process.env['WS_USER_ID'] || 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = process.env['WS_PUBLIC_KEY'] || 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = process.env['WS_PRIVATE_KEY'] || 'test-priv-key'

    mockTokenSuccess()
    mockWebSocketProvider(WebSocketClassProvider)

    mockWsServer = new MockWebsocketServer(wsEndpoint, { mock: false })
    mockWsServer.on('connection', (socket) => {
      socket.on('message', (raw) => {
        framesReceived.push(raw.toString())
        socket.send(tickerFrame())
      })
    })

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: new Date('2022-05-10T16:09:27.193Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
    if (!testAdapter.clock) {
      throw new Error('fake clock required')
    }
    clock = testAdapter.clock
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('subscribes once no matter how callers capitalise the pair', async () => {
    // Three spellings of one wire symbol, the way they turned up in staging.
    await testAdapter.request({ base: 'eth', quote: 'usd' })
    await testAdapter.waitForCache()
    await testAdapter.request({ base: 'ETH', quote: 'USD' })
    await testAdapter.request({ base: 'ETH', quote: 'usd' })

    // Several background passes: without normalisation the stored value flips
    // on each new spelling and every pass emits an unsubscribe plus a
    // resubscribe.
    for (let i = 0; i < 6; i++) {
      await clock.tickAsync(1000)
      await realYield()
    }

    // The churn signature is an unsubscribe for a pair that is still wanted.
    // Asserting on that rather than on the subscribe count keeps this test
    // about the flip: the framework also resubscribes after a reconnect, and
    // it reconnects once on startup here because it treats a connection it has
    // not opened yet as unresponsive.
    expect(actionsFor('ETH.USD')).not.toContain('unsubscribe')
  }, 60_000)
})
