import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { DxLinkMessage, openDxLinkConnection } from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

type TestConnection = {
  sent: DxLinkMessage[]
  send: (data: string) => void
  addEventListener: (event: 'message', listener: (event: { data: unknown }) => void) => void
  emit: (frame: DxLinkMessage | string) => void
}

const makeConnection = (): TestConnection => {
  const sent: DxLinkMessage[] = []
  let messageListener: ((event: { data: unknown }) => void) | undefined
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    addEventListener: (_event: 'message', listener: (event: { data: unknown }) => void) => {
      messageListener = listener
    },
    emit: (frame: DxLinkMessage | string) =>
      messageListener?.({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) }),
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
