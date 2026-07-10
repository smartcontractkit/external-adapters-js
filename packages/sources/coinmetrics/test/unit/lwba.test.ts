import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  handleCryptoLwbaMessage,
  WsCryptoLwbaAssetQuoteSuccessResponse,
  WsCryptoLwbaPairQuoteSuccessResponse,
} from '../../src/transport/lwba'

LoggerFactoryProvider.set()

const QUOTE_FIELDS = {
  time: '2023-03-08T04:04:33.750000000Z',
  ask_price: '0.99',
  ask_size: '1',
  bid_price: '0.98',
  bid_size: '1',
  mid_price: '0.985',
  spread: '0.01',
  cm_sequence_id: '1',
}

const ASSET_QUOTE_MESSAGE: WsCryptoLwbaAssetQuoteSuccessResponse = {
  asset: 'frax_frax',
  ...QUOTE_FIELDS,
}

const PAIR_QUOTE_MESSAGE: WsCryptoLwbaPairQuoteSuccessResponse = {
  pair: 'frax_frax-usd',
  ...QUOTE_FIELDS,
}

describe('handleCryptoLwbaMessage', () => {
  it('parses asset-quotes websocket messages', () => {
    const result = handleCryptoLwbaMessage(ASSET_QUOTE_MESSAGE)
    expect(result).toEqual([
      {
        params: {
          base: 'frax_frax',
          quote: 'USD',
        },
        response: {
          result: null,
          data: {
            bid: 0.98,
            mid: 0.985,
            ask: 0.99,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(QUOTE_FIELDS.time).getTime(),
          },
        },
      },
    ])
  })

  it('parses legacy pair-quotes websocket messages', () => {
    const result = handleCryptoLwbaMessage(PAIR_QUOTE_MESSAGE)
    expect(result).toEqual([
      {
        params: {
          base: 'frax_frax',
          quote: 'usd',
        },
        response: {
          result: null,
          data: {
            bid: 0.98,
            mid: 0.985,
            ask: 0.99,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(QUOTE_FIELDS.time).getTime(),
          },
        },
      },
    ])
  })

  it('defaults quote to USD when pair has no quote segment', () => {
    const result = handleCryptoLwbaMessage({
      pair: 'btc',
      ...QUOTE_FIELDS,
    })
    expect(result?.[0].params).toEqual({
      base: 'btc',
      quote: 'USD',
    })
  })
})
