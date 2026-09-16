import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../../src/endpoint/stock-quotes'
import { transport as priceTransport } from '../../src/transport/price-ws'
import { transport as stockQuotesTransport } from '../../src/transport/stock-quotes'
import { buildWsTransport } from '../../src/transport/ws'

// sendMessages logs via the framework logger, which needs a factory set before use.
LoggerFactoryProvider.set()

type SubMessage = {
  channel: string
  data: { add?: Record<string, string[]>; remove?: Record<string, string[]> }
}

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

    it('should build an unsubscribe message for a ticker that is truly stale (not desired by any params combo)', () => {
      const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }

      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: [],
        new: [],
        stale: [nowStale],
      }) as SubMessage[][]

      const removed = messages.flat().filter((m) => m.data.remove)
      expect(removed).toHaveLength(1)
      expect(removed[0].data.remove).toEqual({ Quote: ['TSLA'] })
    })

    it('should build an add message for each new subscription, deduping entries that map to the same ticker', () => {
      const newSubs = [
        { base: 'TSLA', requireVolume: false, isOvernight: false },
        { base: 'TSLA', requireVolume: true, isOvernight: false },
      ]

      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: newSubs,
        new: newSubs,
        stale: [],
      }) as SubMessage[][]

      const added = messages.flat().filter((m) => m.data.add)
      // Both new params combos map to the same `Quote: ['TSLA']` ticker, so only one add message
      // should be sent even though there are two new subscriptions.
      expect(added).toHaveLength(1)
      expect(added[0].data.add).toEqual({ Quote: ['TSLA'] })
    })

    it('should build both add and remove messages when a delta has new and stale entries in the same cycle', () => {
      const newSub = { base: 'AAPL', requireVolume: false, isOvernight: false }
      const staleSub = { base: 'TSLA', requireVolume: false, isOvernight: false }

      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: [newSub],
        new: [newSub],
        stale: [staleSub],
      }) as SubMessage[][]

      const flattened = messages.flat()
      const added = flattened.filter((m) => m.data.add)
      const removed = flattened.filter((m) => m.data.remove)

      expect(added).toHaveLength(1)
      expect(added[0].data.add).toEqual({ Quote: ['AAPL'] })
      expect(removed).toHaveLength(1)
      expect(removed[0].data.remove).toEqual({ Quote: ['TSLA'] })
    })

    it('should return no messages when there are no new or stale subscriptions', () => {
      const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }

      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: [stillDesired],
        new: [],
        stale: [],
      }) as SubMessage[][]

      expect(messages).toHaveLength(0)
    })

    it('should build add messages for every ticker produced by a multi-ticker formatTicker (price-ws Trade + TradeETH)', () => {
      const newSub = { base: 'ABNB:USLF24' }

      const messages = priceTransport.subscriptionMessageBuilder?.(
        {} as any,
        {
          desired: [newSub],
          new: [newSub],
          stale: [],
        } as any,
      ) as SubMessage[][]

      const added = messages.flat().filter((m) => m.data.add)
      expect(added).toHaveLength(2)
      expect(added.map((m) => m.data.add)).toEqual(
        expect.arrayContaining([{ Trade: ['ABNB:USLF24'] }, { TradeETH: ['ABNB:USLF24'] }]),
      )
    })
  })

  describe('sendMessages (WS frame serialization)', () => {
    it('should serialize each batch produced by the custom builder as its own JSON array frame', async () => {
      const newSub = { base: 'AAPL', requireVolume: false, isOvernight: false }
      const staleSub = { base: 'TSLA', requireVolume: false, isOvernight: false }

      ;(stockQuotesTransport as any).connectionClientId = 'test-client-id'
      const messages = stockQuotesTransport.subscriptionMessageBuilder?.({} as any, {
        desired: [newSub],
        new: [newSub],
        stale: [staleSub],
      })

      ;(stockQuotesTransport as any).wsConnection = mockConnection

      await stockQuotesTransport.sendMessages({} as any, messages as unknown[])

      expect(mockConnection.send).toHaveBeenCalledTimes(2)
      expect(mockConnection.send).toHaveBeenCalledWith(
        JSON.stringify([
          {
            channel: '/service/sub',
            data: { remove: { Quote: ['TSLA'] } },
            clientId: 'test-client-id',
          },
        ]),
      )
      expect(mockConnection.send).toHaveBeenCalledWith(
        JSON.stringify([
          {
            channel: '/service/sub',
            data: { add: { Quote: ['AAPL'] } },
            clientId: 'test-client-id',
          },
        ]),
      )
    })
  })
})
