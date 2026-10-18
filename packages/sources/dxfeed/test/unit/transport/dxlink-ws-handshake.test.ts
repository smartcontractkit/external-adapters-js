import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { transport as stockQuotesTransport } from '../../../src/transport/stock-quotes'
import { DxLinkMessage, openDxLinkConnection } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item 2 proving test (spec primary_command; exceptions
 * basic-auth-not-oauth and dxlink-control-protocol; finalto quote.ts open-gate
 * pattern): the Basic Authorization header rides the WS upgrade request, the
 * SETUP -> CHANNEL_REQUEST -> FEED_SETUP control sequence goes out in the
 * primary_command order, and the open Promise settles on FEED_CONFIG (resolve),
 * an ERROR frame (provider error) or the WS_CONNECTION_OPEN_TIMEOUT budget.
 * The upgrade-request headers are what the framework passes from the
 * transport's options() hook to its ws client, so the header is asserted
 * through that hook against fake settings only (all hosts fake per
 * test_fake_urls).
 */

type TestConnection = {
  sent: DxLinkMessage[]
  send: (data: string) => void
  addEventListener: (
    event: 'message' | 'close',
    listener: (event: { data?: unknown; code?: number }) => void,
  ) => void
  emit: (frame: DxLinkMessage | string) => void
  emitClose: (code?: number) => void
}

const makeConnection = (): TestConnection => {
  const sent: DxLinkMessage[] = []
  const listeners = new Map<
    string,
    ((event: { data?: unknown; code?: number }) => void) | undefined
  >()
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    addEventListener: (
      event: 'message' | 'close',
      listener: (event: { data?: unknown; code?: number }) => void,
    ) => {
      listeners.set(event, listener)
    },
    emit: (frame: DxLinkMessage | string) =>
      listeners.get('message')?.({
        data: typeof frame === 'string' ? frame : JSON.stringify(frame),
      }),
    emitClose: (code = 1006) => listeners.get('close')?.({ code }),
  }
}

/** Resolves 'pending' for an unsettled promise, else its settled state. */
const settledState = (p: Promise<unknown>) =>
  Promise.race([
    p.then(
      () => 'resolved' as const,
      () => 'rejected' as const,
    ),
    Promise.resolve().then(() => 'pending' as const),
  ])

describe('Authorization header on the upgrade request (spec data_source_authentication.usage.handshake_header: "Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>")', () => {
  const CREDENTIALS = { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }
  const EXPECTED = `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`

  it('the transport hands the ws client the Basic Authorization header for the upgrade request', () => {
    const transportConfig = (stockQuotesTransport as any).config
    expect(transportConfig.options({ adapterSettings: CREDENTIALS })).toEqual({
      headers: { Authorization: EXPECTED },
    })
  })

  it('the upgrade request goes to WS_API_ENDPOINT verbatim — credentials never ride the URL', () => {
    // Spec breaking_change_env_checks: credentials move out of the URL into the
    // Basic auth header; the endpoint value is a clean wss:// URL
    const transportConfig = (stockQuotesTransport as any).config
    const url = transportConfig.url({
      adapterSettings: { WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink' },
    })
    expect(url).toBe('wss://dxlink.fake.test/dxlink-chainlink')
    expect(url).not.toContain('@')
  })

  it('a missing credential pair refuses to build a header instead of encoding "undefined:undefined"', () => {
    const transportConfig = (stockQuotesTransport as any).config
    expect(() => transportConfig.options({ adapterSettings: {} })).toThrow(/API_USERNAME/)
  })
})

describe('handshake control sequence (spec primary_command: SETUP, CHANNEL_REQUEST channel 1 service FEED contract AUTO, FEED_SETUP COMPACT)', () => {
  it('sends SETUP then CHANNEL_REQUEST then FEED_SETUP in the primary_command order and shapes', () => {
    const connection = makeConnection()
    void openDxLinkConnection(connection)

    expect(connection.sent.map((m) => m.type)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

    const [setup, channelRequest, feedSetup] = connection.sent
    // Spec primary_command -x message 1
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    // Spec primary_command -x message 2
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    // Spec primary_command -x message 3: COMPACT data format and the
    // acceptEventFields lists per endpoint (Quote for stock_quotes, Trade and
    // TradeETH for price)
    expect(feedSetup.channel).toBe(1)
    expect(feedSetup.acceptAggregationPeriod).toBe(1)
    expect(feedSetup.acceptDataFormat).toBe('COMPACT')
    expect(feedSetup.acceptEventFields?.Quote).toEqual(frames.quoteFeedConfig.eventFields.Quote)
    expect(feedSetup.acceptEventFields?.Trade).toEqual(frames.priceFeedConfig.eventFields.Trade)
    expect(feedSetup.acceptEventFields?.TradeETH).toEqual(
      frames.priceFeedConfig.eventFields.TradeETH,
    )
  })
})

describe('open gate (finalto quote.ts pattern: open resolves ONLY once FEED_CONFIG arrives)', () => {
  it('stays pending through non-FEED_CONFIG frames and resolves on FEED_CONFIG, handing over the accepted eventFields', async () => {
    const connection = makeConnection()
    let captured: Record<string, string[]> | undefined
    const opened = openDxLinkConnection(connection, (fields) => (captured = fields), 10_000)

    expect(await settledState(opened)).toBe('pending')
    connection.emit(frames.keepaliveFrame)
    expect(await settledState(opened)).toBe('pending')

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
    expect(captured).toEqual({ Quote: frames.quoteFeedConfig.eventFields.Quote })
  })

  it('rejects on an ERROR frame with the provider error (template error-mapping extension point)', async () => {
    const connection = makeConnection()
    const opened = openDxLinkConnection(connection)

    connection.emit(frames.errorFrame)
    await expect(opened).rejects.toThrow(/Unauthorized/)
  })

  it('rejects when the connection closes before FEED_CONFIG (rejected credentials drop the handshake)', async () => {
    const connection = makeConnection()
    const opened = openDxLinkConnection(connection, undefined, 10_000)

    connection.emitClose(1006)
    await expect(opened).rejects.toThrow(/closed before FEED_CONFIG/)
  })

  it('rejects when no FEED_CONFIG arrives within the WS_CONNECTION_OPEN_TIMEOUT budget', async () => {
    jest.useFakeTimers()
    try {
      const connection = makeConnection()
      const opened = openDxLinkConnection(connection, undefined, 10_000)

      expect(await settledState(opened)).toBe('pending')
      await jest.advanceTimersByTimeAsync(10_000)
      await expect(opened).rejects.toThrow(/handshake did not complete/)
    } finally {
      jest.useRealTimers()
    }
  })

  it('resolves when FEED_CONFIG arrives just inside the open budget', async () => {
    jest.useFakeTimers()
    try {
      const connection = makeConnection()
      const opened = openDxLinkConnection(connection, undefined, 10_000)

      await jest.advanceTimersByTimeAsync(9_999)
      connection.emit(frames.quoteFeedConfig)
      await expect(opened).resolves.toBeUndefined()
      // The settled gate is not timed out afterwards
      await jest.advanceTimersByTimeAsync(10_000)
      await expect(opened).resolves.toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('transport handlers.open wiring (the negotiated FEED_CONFIG layout gates later parsing)', () => {
  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }

  it('runs the handshake on open, then parses a later FEED_DATA frame with the layout captured at open time', async () => {
    const transportConfig = (stockQuotesTransport as any).config
    const connection = makeConnection()

    const open = transportConfig.handlers.open(connection, {
      adapterSettings: { WS_CONNECTION_OPEN_TIMEOUT: 10_000 },
    })
    expect(connection.sent.map((m: DxLinkMessage) => m.type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])

    connection.emit(frames.quoteFeedConfig)
    await expect(open).resolves.toBeUndefined()

    transportConfig.builders.customSubscriptionMessages(
      {},
      { desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] },
    )

    // Spec stock_quotes sample_response frame: the aggregated Quote record
    // maps per response_mapping — mid (bidPrice+askPrice)/2, bid/ask prices,
    // volumes, and providerIndicatedTimeUnixMs = time
    const results = transportConfig.handlers.message(frames.stockQuotesFrame)
    expect(results).toHaveLength(1)
    expect(results[0].params).toEqual(QUOTE_PARAMS)
    // Spec request/response example: result = mid_price = 190.0
    expect(results[0].response.result).toBe(190.0)
    expect(results[0].response.data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(results[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })

  it('drops FEED_DATA for an event type the negotiated FEED_CONFIG never declared', async () => {
    const transportConfig = (stockQuotesTransport as any).config
    const connection = makeConnection()

    const open = transportConfig.handlers.open(connection, {
      adapterSettings: { WS_CONNECTION_OPEN_TIMEOUT: 10_000 },
    })
    // A FEED_CONFIG that only negotiated Quote fields (no Trade/TradeETH)
    connection.emit(frames.quoteFeedConfig)
    await open

    const tradeParams = { base: 'AAPL:USLF24', quote: 'USD' }
    transportConfig.builders.customSubscriptionMessages(
      {},
      { desired: [tradeParams], new: [tradeParams], stale: [] },
    )

    // A COMPACT Trade record cannot be positioned without a Trade field order:
    // no data update, no error
    expect(transportConfig.handlers.message(frames.priceTradeFrame)).toEqual([])
  })
})
