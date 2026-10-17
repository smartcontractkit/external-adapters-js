import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { transport as stockQuotesTransport } from '../../../src/transport/stock-quotes'
import { DxLinkMessage, openDxLinkConnection } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The feed logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

type Listener = (event: { data?: unknown; code?: number }) => void

/**
 * Fake connection with listener bookkeeping: exposes the listenerCount the
 * proving assertions need, on top of the add/remove/send surface the open gate
 * uses (the framework's ws client implements removeEventListener the same way).
 */
const makeConnection = () => {
  const sent: DxLinkMessage[] = []
  const listeners = new Map<string, Set<Listener>>()
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    // The underlying ws client's close: the CHANNEL_CLOSED assertions spy it to
    // prove the in-band channel close never tears the socket down
    close: jest.fn(),
    addEventListener: (event: 'message' | 'close', listener: Listener) => {
      const set = listeners.get(event) ?? new Set<Listener>()
      set.add(listener)
      listeners.set(event, set)
    },
    removeEventListener: (event: 'message' | 'close', listener: Listener) => {
      listeners.get(event)?.delete(listener)
    },
    listenerCount: (event: 'message' | 'close') => listeners.get(event)?.size ?? 0,
    emit: (frame: DxLinkMessage | string) => {
      for (const listener of [...(listeners.get('message') ?? [])]) {
        listener({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) })
      }
    },
    emitClose: (code = 1006) => {
      for (const listener of [...(listeners.get('close') ?? [])]) {
        listener({ code })
      }
    },
  }
}

describe('open-gate listener lifetime (round-2 item 2: the transport handler is the sole frame parser after open)', () => {
  it('leaves exactly the transport message listener registered once the open gate resolves', async () => {
    const connection = makeConnection()

    // The framework registers its message handler before running handlers.open
    const transportMessageHandler = jest.fn()
    const transportCloseHandler = jest.fn()
    connection.addEventListener('message', transportMessageHandler)
    connection.addEventListener('close', transportCloseHandler)
    expect(connection.listenerCount('message')).toBe(1)

    const opened = openDxLinkConnection(connection)
    // The open gate added one 'message' listener and one 'close' listener
    expect(connection.listenerCount('message')).toBe(2)
    expect(connection.listenerCount('close')).toBe(2)

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()

    // The open-gate listeners are gone: the transport handler is the sole
    // 'message' listener, and no open-gate 'close' listener remains
    expect(connection.listenerCount('message')).toBe(1)
    expect(connection.listenerCount('close')).toBe(1)
  })

  it('parses a later frame exactly once — no second parse by a leftover open-gate listener', async () => {
    const connection = makeConnection()

    // The framework's message handler parses every frame it receives
    const transportMessageHandler = jest.fn((event: { data?: unknown }) =>
      JSON.parse(String(event.data)),
    )
    connection.addEventListener('message', transportMessageHandler)

    const parseSpy = jest.spyOn(JSON, 'parse')
    try {
      const opened = openDxLinkConnection(connection)
      connection.emit(frames.quoteFeedConfig)
      await expect(opened).resolves.toBeUndefined()

      // The handshake frame itself reached the transport handler once; only the
      // post-handshake frames are counted below
      parseSpy.mockClear()
      transportMessageHandler.mockClear()

      // A post-handshake frame: parsed once for the transport handler, not a
      // second time by the open-gate listener
      connection.emit(frames.keepaliveFrame)
      expect(parseSpy).toHaveBeenCalledTimes(1)
      expect(transportMessageHandler).toHaveBeenCalledTimes(1)

      connection.emit(frames.keepaliveFrame)
      expect(parseSpy).toHaveBeenCalledTimes(2)
      expect(transportMessageHandler).toHaveBeenCalledTimes(2)
    } finally {
      parseSpy.mockRestore()
    }
  })

  it('removes the open-gate close listener too, so a post-handshake close reaches only the framework', async () => {
    const connection = makeConnection()
    const transportCloseHandler = jest.fn()
    connection.addEventListener('close', transportCloseHandler)

    const opened = openDxLinkConnection(connection)
    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()

    // The gate's close listener is gone; the framework's own close handler
    // still fires (post-handshake closes are framework business)
    expect(() => connection.emitClose()).not.toThrow()
    expect(transportCloseHandler).toHaveBeenCalledTimes(1)
  })
})

describe('CHANNEL_CLOSED is an in-band dxLink message (no error result, no reconnect)', () => {
  it('handlers.message emits no result, never closes the socket and never re-runs the handshake', async () => {
    const connection = makeConnection()

    // Open the real transport handlers against the fake connection: the dxLink
    // handshake (SETUP, CHANNEL_REQUEST, FEED_SETUP) goes out exactly once
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: {},
    })
    connection.emit(frames.quoteFeedConfig)
    await opened
    const handshakeCount = connection.sent.length
    expect(handshakeCount).toBe(3)

    // The provider closes the dxLink feed channel in-band; the WebSocket
    // itself stays open
    const results = (stockQuotesTransport as any).config.handlers.message(
      frames.channelClosedFrame as any,
    )

    // (a) no result at all is emitted — in particular no error result
    expect(results).toEqual([])

    // (b) no reconnect: the socket is not closed and no re-handshake is sent —
    // the cached last value keeps serving across the channel-close window
    expect(connection.close).not.toHaveBeenCalled()
    expect(connection.sent).toHaveLength(handshakeCount)
  })
})
