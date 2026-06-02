import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { transport as lwbaTransport } from '../../src/transport/crypto-lwba'
import { transport as priceTransport } from '../../src/transport/price'
import {
  buildBatchSubscribeMessage,
  buildBlocksizeWebsocketTickersMessage,
  buildTicker,
  buildTickers,
  TickerParam,
} from '../../src/transport/utils'
import { transport as vwapTransport } from '../../src/transport/vwap'

type BatchBuilders = {
  batchSubscribeMessage: (params: TickerParam[]) => unknown
  batchUnsubscribeMessage: (params: TickerParam[]) => unknown
}

const getBatchBuilders = (
  transport: WebsocketReverseMappingTransport<unknown, string>,
): BatchBuilders =>
  (transport as unknown as { config: { builders: BatchBuilders } }).config.builders

describe('transport utils', () => {
  describe('buildTicker', () => {
    it('concatenates and uppercases base and quote', () => {
      expect(buildTicker({ base: 'eth', quote: 'usd' })).toBe('ETHUSD')
    })
  })

  describe('buildTickers', () => {
    it('maps each param to a ticker once', () => {
      const params = [
        { base: 'ETH', quote: 'EUR' },
        { base: 'LINK', quote: 'ETH' },
      ]
      expect(buildTickers(params)).toEqual(['ETHEUR', 'LINKETH'])
    })
  })

  describe('buildBlocksizeWebsocketTickersMessage', () => {
    it('includes all tickers in a single message', () => {
      const result = buildBlocksizeWebsocketTickersMessage('vwap_subscribe', ['ETHEUR', 'LINKETH'])
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'vwap_subscribe',
        params: { tickers: ['ETHEUR', 'LINKETH'] },
      })
    })
  })

  describe('buildBatchSubscribeMessage', () => {
    it('subscribes using local subscriptions plus new params, not just the delta', () => {
      const existing: TickerParam[] = [{ base: 'BTC', quote: 'USD' }]
      const newParams: TickerParam[] = [
        { base: 'ETH', quote: 'EUR' },
        { base: 'LINK', quote: 'ETH' },
      ]
      const transport = {
        localSubscriptions: existing,
        setReverseMapping: jest.fn(),
      } as unknown as WebsocketReverseMappingTransport<unknown, string>

      const message = buildBatchSubscribeMessage('vwap_subscribe', transport, newParams)

      expect(message).toEqual({
        jsonrpc: '2.0',
        method: 'vwap_subscribe',
        params: { tickers: ['BTCUSD', 'ETHEUR', 'LINKETH'] },
      })
      expect(transport.setReverseMapping).toHaveBeenCalledTimes(3)
    })

    it('skips resubscribe when there are no new params', () => {
      const transport = {
        localSubscriptions: [{ base: 'BTC', quote: 'USD' }],
        setReverseMapping: jest.fn(),
      } as unknown as WebsocketReverseMappingTransport<unknown, string>

      expect(buildBatchSubscribeMessage('vwap_subscribe', transport, [])).toBeUndefined()
      expect(transport.setReverseMapping).not.toHaveBeenCalled()
    })
  })
})

describe.each([
  ['price', priceTransport, 'vwap_subscribe', 'vwap_unsubscribe'],
  ['vwap', vwapTransport, 'fixedvwap_subscribe', 'fixedvwap_unsubscribe'],
  ['crypto-lwba', lwbaTransport, 'bidask_subscribe', 'bidask_unsubscribe'],
] as const)(
  '%s transport batch builders',
  (_name, transport, subscribeMethod, unsubscribeMethod) => {
    const params: TickerParam[] = [
      { base: 'ETH', quote: 'EUR' },
      { base: 'LINK', quote: 'ETH' },
    ]

    it('sends one subscribe message containing all tickers from local state plus new params', () => {
      const setReverseMapping = jest.spyOn(transport, 'setReverseMapping')
      Object.defineProperty(transport, 'localSubscriptions', {
        configurable: true,
        value: [],
      })
      const message = getBatchBuilders(transport).batchSubscribeMessage(params)

      expect(message).toEqual({
        jsonrpc: '2.0',
        method: subscribeMethod,
        params: { tickers: ['ETHEUR', 'LINKETH'] },
      })
      expect(setReverseMapping).toHaveBeenCalledTimes(2)
      expect(setReverseMapping).toHaveBeenCalledWith('ETHEUR', params[0])
      expect(setReverseMapping).toHaveBeenCalledWith('LINKETH', params[1])

      setReverseMapping.mockRestore()
    })

    it('uses batch builders instead of per-ticker subscribeMessage', () => {
      const builders = getBatchBuilders(transport) as BatchBuilders & {
        subscribeMessage?: unknown
        unsubscribeMessage?: unknown
      }

      expect(builders.batchSubscribeMessage).toBeDefined()
      expect(builders.batchUnsubscribeMessage).toBeDefined()
      expect(builders.subscribeMessage).toBeUndefined()
      expect(builders.unsubscribeMessage).toBeUndefined()
    })

    it('sends one unsubscribe message containing all tickers', () => {
      const message = getBatchBuilders(transport).batchUnsubscribeMessage(params)

      expect(message).toEqual({
        jsonrpc: '2.0',
        method: unsubscribeMethod,
        params: { tickers: ['ETHEUR', 'LINKETH'] },
      })
    })
  },
)
