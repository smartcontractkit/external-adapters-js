import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { transport as lwbaTransport } from '../../src/transport/crypto-lwba'
import { transport as priceTransport } from '../../src/transport/price'
import { transport as vwapTransport } from '../../src/transport/vwap'

LoggerFactoryProvider.set()

type TickerParam = { base: string; quote: string }

type CustomSubscriptionMessagesBuilder = (
  context: EndpointContext<unknown>,
  subscriptions: SubscriptionDeltas<TickerParam>,
) => unknown[]

const getCustomSubscriptionMessages = (
  transport: WebsocketReverseMappingTransport<unknown, string>,
): CustomSubscriptionMessagesBuilder =>
  (
    transport as unknown as {
      config: { builders: { customSubscriptionMessages: CustomSubscriptionMessagesBuilder } }
    }
  ).config.builders.customSubscriptionMessages

const context = {} as EndpointContext<unknown>

describe.each([
  ['price', priceTransport, 'vwap_subscribe', 'vwap_unsubscribe'],
  ['vwap', vwapTransport, 'fixedvwap_subscribe', 'fixedvwap_unsubscribe'],
  ['crypto-lwba', lwbaTransport, 'bidask_subscribe', 'bidask_unsubscribe'],
] as const)(
  '%s transport customSubscriptionMessages',
  (_name, transport, subscribeMethod, unsubscribeMethod) => {
    const newParams: TickerParam[] = [
      { base: 'ETH', quote: 'EUR' },
      { base: 'LINK', quote: 'ETH' },
    ]
    const staleParams: TickerParam[] = [{ base: 'BTC', quote: 'USD' }]

    it('sends one subscribe message containing all new tickers', () => {
      const setReverseMapping = jest.spyOn(transport, 'setReverseMapping')
      const subscriptions: SubscriptionDeltas<TickerParam> = {
        desired: newParams,
        new: newParams,
        stale: [],
      }

      const messages = getCustomSubscriptionMessages(transport)(context, subscriptions)

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

      const messages = getCustomSubscriptionMessages(transport)(context, subscriptions)

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

      const messages = getCustomSubscriptionMessages(transport)(context, subscriptions)

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

      expect(getCustomSubscriptionMessages(transport)(context, subscriptions)).toEqual([])
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
  },
)
