import { BaseEndpointTypes } from '../../src/endpoint/stock-quotes'
import { transport as stockQuotesTransport } from '../../src/transport/stock-quotes'
import { buildWsTransport } from '../../src/transport/ws'

describe('DxFeed WebSocket Transport', () => {
  let mockConnection: { send: jest.Mock }
  let transport: ReturnType<typeof buildWsTransport<BaseEndpointTypes>>

  beforeEach(() => {
    mockConnection = { send: jest.fn() }

    transport = buildWsTransport<BaseEndpointTypes>(
      (params) => [{ Quote: [params.base.toUpperCase()] }],
      () => [],
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('heartbeat handler', () => {
    it('should send heartbeat message when called', () => {
      ;(transport as any).connectionClientId = 'test-client-id'
      ;(transport as any).config.handlers.heartbeat(mockConnection)

      expect(mockConnection.send).toHaveBeenCalledWith(
        '[{"id":1,"clientId":"test-client-id","channel":"/meta/connect","connectionType":"websocket"}]',
      )
    })
  })

  describe('subscription set collapsing onto a single DP ticker', () => {
    // The framework's subscription set tracks subscriptions by JSON.stringify-ing the *entire*
    // validated params object (see StreamingTransport.backgroundHandler), so
    // {base:'TSLA', requireVolume:false} and {base:'TSLA', requireVolume:true} are two distinct
    // subscriptions from the framework's point of view. But stock-quotes' formatTicker only looks
    // at `base`, so both collapse onto the same DxFeed ticker (`Quote: ['TSLA']`). If one of those
    // params combos expires while the other is still desired, the framework will still ask this
    // transport to unsubscribe from the shared ticker, killing the feed for the still-active one.
    it('should not build an unsubscribe message for a ticker still required by another desired subscription', () => {
      const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }
      const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }

      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: [stillDesired],
        new: [],
        stale: [nowStale],
      }) as { channel: string; data: { remove?: Record<string, string[]> } }[][]

      // Each per-subscription builder call yields a batch (one DxFeed protocol frame per
      // params entry), so flatten one level to inspect the individual sub/unsub operations.
      const unsubscribesSharedTicker = messages
        .flat()
        .some((m) => JSON.stringify(m.data.remove) === JSON.stringify({ Quote: ['TSLA'] }))

      // `stillDesired` (a different full params object, but the same DP ticker) is still in the
      // desired set, so the shared ticker must not be unsubscribed.
      expect(unsubscribesSharedTicker).toBe(false)
    })
  })
})
