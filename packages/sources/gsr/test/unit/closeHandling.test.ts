import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TokenWithExpiry } from '../../src/transport/authutils'
import { GsrWebSocketTransport } from '../../src/transport/price'
import { REAUTH_MIN_INTERVAL_MS } from '../../src/transport/tokenRefresh'

LoggerFactoryProvider.set()

// Drives the transport's connection handlers directly, with plain objects
// standing in for sockets, to cover orderings that are hard to stage through a
// mock server.

type Handlers = {
  open: (connection: unknown, context: unknown) => Promise<void>
  close: (event: { code: number; reason: string; target: unknown }, context: unknown) => void
  message: (message: unknown) => unknown
}

type Internals = {
  config: { handlers: Handlers }
  cachedToken: TokenWithExpiry | null
  refreshTimer?: NodeJS.Timeout
  receivedTicker: boolean
}

const ONE_HOUR_MS = 60 * 60 * 1000

const context = {
  adapterSettings: {
    API_ENDPOINT: 'https://oracle.prod.gsr.io/v1',
    WS_USER_ID: 'test-user-id',
    WS_PRIVATE_KEY: 'test-priv-key',
  },
}

const ticker = {
  type: 'ticker',
  data: { symbol: 'ETH.USD', price: 1234, bidPrice: 1233, askPrice: 1235, ts: 0 },
}

describe('GsrWebSocketTransport close handling', () => {
  let transport: Internals
  let handlers: Handlers
  const token = (name: string): TokenWithExpiry => ({
    token: name,
    expiresAtMs: Date.now() + ONE_HOUR_MS,
  })
  const close = (target: unknown, reason = '') =>
    handlers.close({ code: 1000, reason, target }, context)

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-06T16:57:50.000Z') })
    transport = new GsrWebSocketTransport() as unknown as Internals
    handlers = transport.config.handlers
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('leaves the replacement connection alone when a replaced socket reports its close late', async () => {
    const oldSocket = { name: 'old' }
    const newSocket = { name: 'new' }

    transport.cachedToken = token('old-token')
    await handlers.open(oldSocket, context)

    // The framework drops the old socket as unresponsive and opens the new one
    // in the same pass; the new one starts streaming before the old close lands.
    transport.cachedToken = token('new-token')
    await handlers.open(newSocket, context)
    handlers.message(ticker)
    const newTimer = transport.refreshTimer

    close(oldSocket)

    expect(newTimer).toBeDefined()
    expect(transport.refreshTimer).toBe(newTimer)
    expect(transport.receivedTicker).toBe(true)
    expect(transport.cachedToken?.token).toEqual('new-token')
  })

  it('handles the close of the current connection normally', async () => {
    const socket = { name: 'current' }
    transport.cachedToken = token('refused-token')
    await handlers.open(socket, context)
    expect(transport.refreshTimer).toBeDefined()

    close(socket, 'Bye')

    expect(transport.refreshTimer).toBeUndefined()
    expect(transport.cachedToken).toBeNull()
  })

  it('keeps the token when the closed session had delivered a ticker', async () => {
    const socket = { name: 'current' }
    transport.cachedToken = token('good-token')
    await handlers.open(socket, context)
    handlers.message(ticker)

    close(socket)

    expect(transport.cachedToken?.token).toEqual('good-token')
  })

  it('discards at most one token per interval while sessions keep being refused', async () => {
    const refuse = async (name: string) => {
      const socket = { name }
      // Stands in for tokenForConnection minting when the cache is empty.
      transport.cachedToken = transport.cachedToken ?? token(`minted-for-${name}`)
      await handlers.open(socket, context)
      close(socket, 'Bye')
    }

    await refuse('first')
    expect(transport.cachedToken).toBeNull()

    await refuse('second')
    expect(transport.cachedToken?.token).toEqual('minted-for-second')

    jest.advanceTimersByTime(REAUTH_MIN_INTERVAL_MS - 1)
    await refuse('third')
    expect(transport.cachedToken?.token).toEqual('minted-for-second')

    jest.advanceTimersByTime(1)
    await refuse('fourth')
    expect(transport.cachedToken).toBeNull()
  })
})
