import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/markprice'

export const markPriceEvents = ['mark_price']
export const topOfBookEvents = ['top_of_book', 'top_of_book_perps', 'top_of_book_spot']

export const inputParameters = new InputParameters(
  {
    exchange: {
      description: 'The exchange to obtain the market price from',
      required: true,
      type: 'string',
    },

    symbol: {
      description: 'The symbol of the base quote asset pair',
      required: true,
      type: 'string',
    },
    type: {
      description: 'The type of the price to obtain',
      required: true,
      type: 'string',
      options: [...markPriceEvents, ...topOfBookEvents],
    },
  },
  [
    {
      exchange: 'binance',
      symbol: 'BTCUSDT',
      type: 'mark_price',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: number
    Data: {
      mid: number
      bid?: number
      ask?: number
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'markprice',
  transport: wsTransport,
  inputParameters,
  requestTransforms: [
    (request) => {
      request.requestContext.data.symbol = request.requestContext.data.symbol.toUpperCase()
      if (request.requestContext.data.type === 'top_of_book') {
        // top_of_book is a legacy mapping for top_of_book_perps
        // it is returned by the firehose API as type: top_of_book
        request.requestContext.data.type = 'top_of_book_perps'
      }
    },
  ],
})
