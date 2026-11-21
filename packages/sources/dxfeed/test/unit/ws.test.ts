/**
 * dxLink transport tests: staged handshake, subscription framing, COMPACT
 * decoding, heartbeat, provider errors and reconnect.
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import {
  awaitWs,
  flushFrames,
  QUOTE_FIELDS,
  quoteFrame,
  quoteRecord,
  ScriptedDxLinkServer,
  setDxLinkTestEnv,
  TRADE_FIELDS,
  tradeFrame,
  tradeRecord,
} from './fixtures'

const WS_URL = 'ws://localhost:9092/dxlink'

describe('dxLink websocket transport', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter
  let recordedSocketOptions: {
    url: string
    options?: { headers?: { Authorization?: string } }
  }[]

  const quoteRequest = { base: 'TSLA', quote: 'USD', endpoint: 'stock_quotes' }
  const priceRequest = {
    endpoint: 'stock',
    from: 'AAPL',
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { AAPL: 'AAPL:USLF24' } },
  }

  const requestJson = async (request: object) => {
    const response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    return response.json()
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    setDxLinkTestEnv(WS_URL)

    server = new ScriptedDxLinkServer(WS_URL)
    server.setFeedData('Quote', 'TSLA', [
      quoteFrame(quoteRecord('TSLA', 1760000002000, 100, 101, 1, 2)),
    ])
    server.setFeedData('Quote', 'AAPL:USLF24', [
      quoteFrame(quoteRecord('AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O')),
    ])
    server.setFeedData('Trade', 'TSLA', [
      tradeFrame('Trade', tradeRecord('Trade', 'TSLA', 1760000002000, 250)),
    ])
    server.setFeedData('Trade', 'AAPL:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'AAPL:USLF24', 1760000000000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'AAPL:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'AAPL:USLF24', 500, 400)),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    recordedSocketOptions = []
    const MockedSocket = WebSocketClassProvider.get()
    class RecordingSocket extends MockedSocket {
      constructor(
        url: string,
        protocols?: string | string[],
        options?: { headers?: { Authorization?: string } },
      ) {
        recordedSocketOptions.push({ url, options })
        super(url, protocols)
      }
    }
    WebSocketClassProvider.set(RecordingSocket)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await requestJson(quoteRequest)
    await requestJson(priceRequest)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  it('sends Basic auth and stages SETUP -> CHANNEL_REQUEST -> FEED_SETUP', () => {
    const expected = 'Basic ' + Buffer.from('fake-user:fake-pass').toString('base64')
    expect(recordedSocketOptions.length).toBeGreaterThan(0)
    recordedSocketOptions.forEach(({ url, options }) => {
      expect(url).toBe(WS_URL)
      expect(options?.headers?.Authorization).toBe(expected)
    })

    const control = server.clientMessages
      .filter((message) => ['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'].includes(message.type))
      .map((message) => message.type)
    expect(control.slice(0, 3)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

    const feedSetups = server.clientMessages.filter((message) => message.type === 'FEED_SETUP')
    expect(feedSetups.map((message) => message.acceptEventFields)).toEqual(
      expect.arrayContaining([
        { Quote: QUOTE_FIELDS },
        { Trade: TRADE_FIELDS, TradeETH: TRADE_FIELDS },
      ]),
    )
    feedSetups.forEach((message) => {
      expect(message).toMatchObject({
        channel: 1,
        acceptAggregationPeriod: 1,
        acceptDataFormat: 'COMPACT',
      })
    })
    expect(server.clientMessages.some((message) => message.type === 'AUTH')).toBe(false)
    expect(server.clientMessages.some((message) => message.clientId !== undefined)).toBe(false)
  })

  it('omits empty add/remove arrays and dedupes per symbol and event type', async () => {
    await requestJson(quoteRequest)
    await flushFrames(testAdapter)

    expect(server.invalidSubscriptionMessages).toEqual([])
    expect(server.added().filter((s) => s.symbol === 'TSLA' && s.type === 'Quote')).toHaveLength(1)
    server.clientMessages
      .filter((message) => message.type === 'FEED_SUBSCRIPTION')
      .forEach((message) => {
        expect(message.add === undefined || message.add.length > 0).toBe(true)
        expect(message.remove === undefined || message.remove.length > 0).toBe(true)
      })
  })

  it('subscribes Trade and TradeETH for :USLF24 and Trade only for bare tickers', async () => {
    await requestJson({
      endpoint: 'stock',
      from: 'TSLA',
      to: 'USD',
      transport: 'ws',
    })
    expect(server.added()).toEqual(
      expect.arrayContaining([
        { symbol: 'AAPL:USLF24', type: 'Trade' },
        { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        { symbol: 'TSLA', type: 'Trade' },
      ]),
    )
    expect(server.added().some((s) => s.symbol === 'TSLA' && s.type === 'TradeETH')).toBe(false)
  })

  it('sends KEEPALIVE on channel 0 at the configured interval', async () => {
    const count = () => server.clientMessages.filter((m) => m.type === 'KEEPALIVE').length
    const before = count()
    await testAdapter.clock?.tickAsync?.(4 * 5000 + 1000)
    expect(count() - before).toBeGreaterThanOrEqual(3)
    server.clientMessages
      .filter((m) => m.type === 'KEEPALIVE')
      .forEach((m) => expect(m.channel).toBe(0))
  })

  it('reconnects on TIMEOUT but not on informational ERROR frames', async () => {
    const setupsBefore = server.countByType('SETUP')
    server.push({ type: 'ERROR', channel: 0, error: 'UNAUTHORIZED', message: 'test' })
    await flushFrames(testAdapter, 2000)
    expect(server.countByType('SETUP')).toBe(setupsBefore)

    server.push({ type: 'ERROR', channel: 0, error: 'TIMEOUT', message: 'test' })
    expect(await awaitWs(testAdapter, () => server.countByType('SETUP') > setupsBefore)).toBe(true)
  })

  it('re-handshakes and resubscribes after CHANNEL_CLOSED', async () => {
    const setupsBefore = server.countByType('SETUP')
    const addsBefore = server.added().length
    server.push({ type: 'CHANNEL_CLOSED', channel: 1 })
    expect(
      await awaitWs(
        testAdapter,
        () => server.countByType('SETUP') > setupsBefore && server.added().length > addsBefore,
      ),
    ).toBe(true)
  })

  it('decodes COMPACT records by FEED_CONFIG order, dropping partial and NUL-padded records', async () => {
    const edgeRequest = { base: 'EDGE', quote: 'USD', endpoint: 'stock_quotes' }
    const partial = quoteRecord('EDGE', 1760000003000, 300, 301, 1, 2).slice(0, -1)
    server.setFeedData('Quote', 'EDGE', [
      quoteFrame(
        quoteRecord('EDGE', 1760000001000, 100, 101, 1, 2),
        quoteRecord('ED\u0000GE', 1760000004000, 400, 401, 3, 4),
        partial,
      ),
    ])
    const body = await requestJson(edgeRequest)
    expect(body.data.bid_price).toBe(400)
    expect(body.data.ask_price).toBe(401)
  })

  const HANDSHAKE_FAILURES = [
    ['provider error', 'failHandshake'],
    ['unauthorized', 'unauthorizedHandshake'],
    ['close', 'closeDuringHandshake'],
    ['non-COMPACT config', 'fullFeedConfig'],
  ] as const

  it.each(HANDSHAKE_FAILURES)('rejects a %s handshake and recovers', async (_name, flag) => {
    const setupsBefore = server.countByType('SETUP')
    server[flag] = true
    try {
      server.closeAll()
      expect(await awaitWs(testAdapter, () => server.countByType('SETUP') > setupsBefore)).toBe(
        true,
      )
    } finally {
      server[flag] = false
    }
    expect(
      await awaitWs(testAdapter, () => server.countByType('SETUP') > setupsBefore + 1, 30000),
    ).toBe(true)
  })

  it('drops a stale invalid frame instead of replacing the last healthy value', async () => {
    const staleRequest = { base: 'STALE', quote: 'USD', endpoint: 'stock_quotes' }
    server.setFeedData('Quote', 'STALE', [
      quoteFrame(quoteRecord('STALE', 1760000005000, 500, 501, 1, 2)),
    ])
    const first = await requestJson(staleRequest)
    expect(first.data.bid_price).toBe(500)

    server.push(quoteFrame(quoteRecord('STALE', 1760000004000, 'NaN', 501, 1, 2)))
    await flushFrames(testAdapter)
    const second = await requestJson(staleRequest)
    expect(second.data.bid_price).toBe(500)
  })
})
