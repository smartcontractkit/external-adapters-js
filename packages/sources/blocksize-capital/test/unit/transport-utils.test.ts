import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import {
  WebsocketReverseMappingTransport,
  WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  transport as lwbaTransport,
  WsTransportTypes as LwbaWsTransportTypes,
} from '../../src/transport/crypto-lwba'
import {
  transport as priceTransport,
  WsTransportTypes as PriceWsTransportTypes,
} from '../../src/transport/price'
import {
  transport as vwapTransport,
  WsTransportTypes as VwapWsTransportTypes,
} from '../../src/transport/vwap'

LoggerFactoryProvider.set()

type TickerParam = { base: string; quote: string }

type CustomSubscriptionMessagesBuilder<T extends WebsocketTransportGenerics> = (
  context: EndpointContext<T>,
  subscriptions: SubscriptionDeltas<TickerParam>,
) => unknown[]

const getCustomSubscriptionMessages = <T extends WebsocketTransportGenerics>(
  transport: WebsocketReverseMappingTransport<T, string>,
): CustomSubscriptionMessagesBuilder<T> =>
  (
    transport as unknown as {
      config: { builders: { customSubscriptionMessages: CustomSubscriptionMessagesBuilder<T> } }
    }
  ).config.builders.customSubscriptionMessages

const runCustomSubscriptionMessages = <T extends WebsocketTransportGenerics>(
  transport: WebsocketReverseMappingTransport<T, string>,
  subscriptions: SubscriptionDeltas<TickerParam>,
) => getCustomSubscriptionMessages(transport)({} as EndpointContext<T>, subscriptions)

const newParams: TickerParam[] = [
  { base: 'ETH', quote: 'EUR' },
  { base: 'LINK', quote: 'ETH' },
]
const staleParams: TickerParam[] = [{ base: 'BTC', quote: 'USD' }]

const testCustomSubscriptionMessages = <T extends WebsocketTransportGenerics>(
  transport: WebsocketReverseMappingTransport<T, string>,
  subscribeMethod: string,
  unsubscribeMethod: string,
) => {
  it('sends one subscribe message containing all new tickers', () => {
    const setReverseMapping = jest.spyOn(transport, 'setReverseMapping')
    const subscriptions: SubscriptionDeltas<TickerParam> = {
      desired: newParams,
      new: newParams,
      stale: [],
    }

    const messages = runCustomSubscriptionMessages(transport, subscriptions)

    expect(messages).toEqual([
      {
        jsonrpc: '2.0',
        method: subscribeMethod,
        params: { tickers: ['ETHEUR', 'LINKETH'] },
      },
    ])
    expect(setReverseMapping).toHaveBeenCalledTimes(2)
    expect(setReverseMapping).toHaveBeenCalledWith('ETHEUR', newParams[0])
    expect(setReverseMapping).toHaveBeenCalledWith('LINKETH', newParams[1])

    setReverseMapping.mockRestore()
  })

  it('sends one unsubscribe message containing all stale tickers', () => {
    const subscriptions: SubscriptionDeltas<TickerParam> = {
      desired: [],
      new: [],
      stale: staleParams,
    }

    const messages = runCustomSubscriptionMessages(transport, subscriptions)

    expect(messages).toEqual([
      {
        jsonrpc: '2.0',
        method: unsubscribeMethod,
        params: { tickers: ['BTCUSD'] },
      },
    ])
  })

  it('batches subscribe and unsubscribe into separate messages when both change', () => {
    const setReverseMapping = jest.spyOn(transport, 'setReverseMapping')
    const subscriptions: SubscriptionDeltas<TickerParam> = {
      desired: newParams,
      new: newParams,
      stale: staleParams,
    }

    const messages = runCustomSubscriptionMessages(transport, subscriptions)

    expect(messages).toEqual([
      {
        jsonrpc: '2.0',
        method: subscribeMethod,
        params: { tickers: ['ETHEUR', 'LINKETH'] },
      },
      {
        jsonrpc: '2.0',
        method: unsubscribeMethod,
        params: { tickers: ['BTCUSD'] },
      },
    ])
    expect(setReverseMapping).toHaveBeenCalledTimes(2)

    setReverseMapping.mockRestore()
  })

  it('returns no messages when there are no subscription changes', () => {
    const subscriptions: SubscriptionDeltas<TickerParam> = {
      desired: newParams,
      new: [],
      stale: [],
    }

    expect(runCustomSubscriptionMessages(transport, subscriptions)).toEqual([])
  })

  it('uses customSubscriptionMessages instead of per-ticker subscribeMessage', () => {
    const builders = (
      transport as unknown as {
        config: {
          builders: {
            customSubscriptionMessages?: unknown
            subscribeMessage?: unknown
            unsubscribeMessage?: unknown
          }
        }
      }
    ).config.builders

    expect(builders.customSubscriptionMessages).toBeDefined()
    expect(builders.subscribeMessage).toBeUndefined()
    expect(builders.unsubscribeMessage).toBeUndefined()
  })
}

describe('price transport customSubscriptionMessages', () => {
  testCustomSubscriptionMessages<PriceWsTransportTypes>(
    priceTransport,
    'vwap_subscribe',
    'vwap_unsubscribe',
  )
})

describe('vwap transport customSubscriptionMessages', () => {
  testCustomSubscriptionMessages<VwapWsTransportTypes>(
    vwapTransport,
    'fixedvwap_subscribe',
    'fixedvwap_unsubscribe',
  )
})

describe('crypto-lwba transport customSubscriptionMessages', () => {
  testCustomSubscriptionMessages<LwbaWsTransportTypes>(
    lwbaTransport,
    'bidask_subscribe',
    'bidask_unsubscribe',
  )
})
