import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from '../../src/transport/stock'

LoggerFactoryProvider.set()

type StubWs = {
  readyState: number
  ping: jest.Mock
  close: jest.Mock
}

/** Handlers are exercised by the framework at runtime; for unit checks we introspect here only. */
function getWsHandlers(): {
  open: () => void
  close: () => void
  heartbeat: (conn: StubWs) => void
  pong: () => void
} {
  // Structural cast only: intersecting with typeof wsTransport yields `never`
  // because WebSocketTransport's `config` is private and conflicts with a public `config`.
  type TransportWithHandlerConfig = {
    config: {
      handlers: {
        open: () => void
        close: () => void
        heartbeat: (conn: StubWs) => void
        pong: () => void
      }
    }
  }
  return (wsTransport as unknown as TransportWithHandlerConfig).config.handlers
}

describe('six stock websocket ping / pong watchdog', () => {
  const handlers = getWsHandlers()

  beforeEach(() => {
    jest.useFakeTimers()
    handlers.open()
  })

  afterEach(() => {
    handlers.close()
    jest.useRealTimers()
  })

  it('closes when no pong arrives before PONG_TIMEOUT', () => {
    const conn: StubWs = {
      readyState: 1,
      ping: jest.fn(),
      close: jest.fn(),
    }
    handlers.heartbeat(conn)

    expect(conn.ping).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1999)
    expect(conn.close).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(conn.close).toHaveBeenCalledWith(
      1006,
      'The connection appears to be active but stopped receiving updates',
    )
  })

  it('does not close when pong clears the watchdog before timeout', () => {
    const conn: StubWs = {
      readyState: 1,
      ping: jest.fn(),
      close: jest.fn(),
    }

    handlers.heartbeat(conn)
    handlers.pong()
    jest.advanceTimersByTime(60_000)

    expect(conn.close).not.toHaveBeenCalled()
  })

  it('closes when heartbeat runs again before pong (interval shorter than pong wait)', () => {
    const conn: StubWs = {
      readyState: 1,
      ping: jest.fn(),
      close: jest.fn(),
    }

    handlers.heartbeat(conn)
    handlers.heartbeat(conn)

    expect(conn.close).toHaveBeenCalledWith(
      1006,
      'Heartbeat frequency exceeded 2000ms, increase WS_HEARTBEAT_INTERVAL_MS in environment variable',
    )

    jest.advanceTimersByTime(60_000)
    expect(conn.close).toHaveBeenCalledTimes(1)
  })
})
