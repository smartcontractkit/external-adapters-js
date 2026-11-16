import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { getToken, TokenWithExpiry } from '../../src/transport/authutils'
import { GsrWebSocketTransport } from '../../src/transport/price'
import { MIN_TOKEN_REQUEST_INTERVAL_MS } from '../../src/transport/tokenRefresh'

jest.mock('../../src/transport/authutils', () => ({
  ...jest.requireActual('../../src/transport/authutils'),
  getToken: jest.fn(),
}))

LoggerFactoryProvider.set()

// Drives the transport's connection callbacks directly, with plain objects
// standing in for sockets, to cover orderings and timings that are hard to
// stage through a mock server.

type Handlers = {
  open: (connection: unknown, context: unknown) => Promise<void>
  close: (event: { code: number; reason: string; target: unknown }, context: unknown) => void
}

type Internals = {
  config: {
    handlers: Handlers
    options: (context: unknown) => Promise<{ headers: Record<string, string> }>
  }
  cachedToken: TokenWithExpiry | null
  refreshTimer?: NodeJS.Timeout
  wsConnection?: unknown
}

const ONE_HOUR_MS = 60 * 60 * 1000

const context = {
  adapterSettings: {
    API_ENDPOINT: 'https://oracle.prod.gsr.io/v1',
    WS_USER_ID: 'test-user-id',
    WS_PUBLIC_KEY: 'test-pub-key',
    WS_PRIVATE_KEY: 'test-priv-key',
  },
}

const getTokenMock = getToken as jest.MockedFunction<typeof getToken>

describe('GsrWebSocketTransport connections', () => {
  let transport: Internals
  let handlers: Handlers
  const token = (name: string): TokenWithExpiry => ({
    token: name,
    expiresAtMs: Date.now() + ONE_HOUR_MS,
  })
  const close = (target: unknown, reason = '') =>
    handlers.close({ code: 1000, reason, target }, context)
  const connectWithToken = async () =>
    (await transport.config.options(context)).headers['x-auth-token']

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-06T16:57:50.000Z') })
    let requests = 0
    getTokenMock.mockReset()
    getTokenMock.mockImplementation(async () => token(`token-${++requests}`))
    transport = new GsrWebSocketTransport() as unknown as Internals
    handlers = transport.config.handlers
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  describe('token per connection', () => {
    it('requests a fresh token for a connection opened after the interval', async () => {
      expect(await connectWithToken()).toEqual('token-1')

      // The incident shape: the token is still well inside its hour, but GSR
      // has refused it, so carrying it over would repeat the refusal.
      jest.advanceTimersByTime(20 * 60 * 1000)

      expect(await connectWithToken()).toEqual('token-2')
      expect(getTokenMock).toHaveBeenCalledTimes(2)
    })

    it('makes at most one token request per interval while sessions keep being refused', async () => {
      expect(await connectWithToken()).toEqual('token-1')

      // Refused sessions reconnect on the next background pass, about a second
      // apart.
      for (let elapsed = 0; elapsed < MIN_TOKEN_REQUEST_INTERVAL_MS - 1_200; elapsed += 1_200) {
        jest.advanceTimersByTime(1_200)
        expect(await connectWithToken()).toEqual('token-1')
      }
      expect(getTokenMock).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1_200)
      expect(await connectWithToken()).toEqual('token-2')
      expect(getTokenMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('close handling', () => {
    // Mirrors the framework: the open handler runs first, then wsConnection is
    // assigned before any close event can be delivered.
    const open = async (socket: unknown) => {
      await handlers.open(socket, context)
      transport.wsConnection = socket
    }

    beforeEach(() => {
      transport.cachedToken = token('current-token')
    })

    it('clears the refresh timer when the current connection closes', async () => {
      const socket = { name: 'current' }
      await open(socket)
      expect(transport.refreshTimer).toBeDefined()

      close(socket, 'Bye')

      expect(transport.refreshTimer).toBeUndefined()
    })

    it('leaves the replacement connection alone when a replaced socket reports its close late', async () => {
      const oldSocket = { name: 'old' }
      const newSocket = { name: 'new' }
      await open(oldSocket)

      // The framework drops the old socket as unresponsive and opens the new
      // one in the same pass; the old close lands after the new open.
      transport.wsConnection = undefined
      await open(newSocket)
      const newTimer = transport.refreshTimer

      close(oldSocket)

      expect(newTimer).toBeDefined()
      expect(transport.refreshTimer).toBe(newTimer)
    })

    it('handles a replaced socket closing before its replacement has opened', async () => {
      const oldSocket = { name: 'old' }
      await open(oldSocket)

      // Unresponsive path: close(1000), then wsConnection is cleared while the
      // replacement connects. If the replacement never opens, the old timer
      // must not keep renewing tokens for an idle adapter.
      transport.wsConnection = undefined
      close(oldSocket)

      expect(transport.refreshTimer).toBeUndefined()
    })

    it('is not misled by a timed-out handshake that opens after the framework gave up on it', async () => {
      const realSocket = { name: 'real' }
      const strayHandshake = { name: 'stray' }
      await open(realSocket)

      // The framework abandons a handshake after WS_CONNECTION_OPEN_TIMEOUT but
      // leaves its open listener attached, so the handler can still run for a
      // socket that never becomes wsConnection.
      await handlers.open(strayHandshake, context)

      close(realSocket, 'Bye')

      expect(transport.refreshTimer).toBeUndefined()
    })
  })
})
