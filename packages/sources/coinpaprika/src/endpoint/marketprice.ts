import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/marketprice'

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
      options: ['mark_price', 'top_of_book'],
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
  name: 'marketprice',
  transport: wsTransport,
  inputParameters,
  requestTransforms: [
    (request) => {
      request.requestContext.data.symbol = request.requestContext.data.symbol.toUpperCase()
    },
  ],
})
