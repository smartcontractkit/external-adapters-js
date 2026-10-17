import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { transport as stockQuotesTransport } from '../../src/transport/stock-quotes'
import { DxLinkMessage, openDxLinkConnection } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

type TestConnection = {
  sent: DxLinkMessage[]
  send: (data: string) => void
  addEventListener: (
    event: 'message' | 'close',
    listener: (event: { data?: unknown; code?: number }) => void,
  ) => void
  emit: (frame: DxLinkMessage | string) => void
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

describe('dxLink handshake (spec primary_command)', () => {
  it('sends SETUP -> CHANNEL_REQUEST -> FEED_SETUP in order with the spec message shapes', async () => {
    const connection = makeConnection()
    void openDxLinkConnection(connection)

    expect(connection.sent.map((m) => m.type)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

    const [setup, channelRequest, feedSetup] = connection.sent
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    expect(feedSetup.channel).toBe(1)
    expect(feedSetup.acceptAggregationPeriod).toBe(1)
    expect(feedSetup.acceptDataFormat).toBe('COMPACT')
    // The server echoes these lists back as the FEED_CONFIG field order the
    // COMPACT FEED_DATA rows follow
    expect(feedSetup.acceptEventFields?.Quote).toEqual(frames.quoteFeedConfig.eventFields.Quote)
    expect(feedSetup.acceptEventFields?.Trade).toEqual(frames.priceFeedConfig.eventFields.Trade)
    expect(feedSetup.acceptEventFields?.TradeETH).toEqual(
      frames.priceFeedConfig.eventFields.TradeETH,
    )
  })

  it('stays pending until FEED_CONFIG arrives, then resolves with the eventFields layout', async () => {
    const connection = makeConnection()
    let captured: Record<string, string[]> | undefined
    const opened = openDxLinkConnection(connection, (fields) => (captured = fields))

    expect(await settledState(opened)).toBe('pending')

    // Non-FEED_CONFIG frames during the handshake do not settle the gate
    connection.emit(frames.keepaliveFrame)
    expect(await settledState(opened)).toBe('pending')

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
    expect(captured).toEqual({ Quote: frames.quoteFeedConfig.eventFields.Quote })
  })

  it('rejects when the provider answers the handshake with an ERROR frame', async () => {
    const connection = makeConnection()
    const opened = openDxLinkConnection(connection)

    connection.emit(frames.errorFrame)
    await expect(opened).rejects.toThrow(/Unauthorized/)
  })

  it('rejects when FEED_CONFIG never arrives within the open timeout', async () => {
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
})

/**
 * The production transport wiring (plan round1-dxlink-ws-transport): the open
 * gate hands the FEED_CONFIG field layout to the SAME feed whose message
 * handler parses later COMPACT FEED_DATA frames, and the framework's
 * customSubscriptionMessages builder registers the desired (symbol, eventType)
 * wire keys. Every other test wires a DxLinkFeed by hand; this one exercises
 * the real transport config end to end — no FEED_CONFIG first means no parsed
 * records, whatever arrives later.
 */
describe('transport handlers.open wiring (spec: FEED_CONFIG field order gates COMPACT parsing)', () => {
  const QUOTE_PARAMS = {
    base: 'AAPL:USLF24',
    quote: 'USD',
    requireVolume: false,
    isOvernight: false,
  }

  it('runs the spec handshake over the connection, then parses FEED_DATA with the FEED_CONFIG layout', async () => {
    const transportConfig = (stockQuotesTransport as any).config
    const connection = makeConnection()

    // handlers.open sends the spec handshake and resolves once FEED_CONFIG
    // arrives (spec primary_command; handshake must fit WS_CONNECTION_OPEN_TIMEOUT)
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

    // The framework builder registers the desired subscription wire keys
    transportConfig.builders.customSubscriptionMessages(
      {},
      { desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] },
    )

    // A later FEED_DATA frame is parsed with the layout captured at open time.
    // The spec sample frame concatenates two records for the same wire key; the
    // LAST one wins (the freshest quote): mid 190.0, bid 189.90/50,
    // ask 190.10/80, providerIndicatedTimeUnixMs 1760000001000
    const results = transportConfig.handlers.message(frames.stockQuotesFrame)
    expect(results).toHaveLength(1)
    expect(results[0].params).toEqual(QUOTE_PARAMS)
    expect(results[0].response.result).toBe(190)
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

    // The spec price Trade frame cannot be positioned without a Trade field
    // order: no data update, no error
    expect(transportConfig.handlers.message(frames.priceTradeFrame)).toEqual([])
  })
})
