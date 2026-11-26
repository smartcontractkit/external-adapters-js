import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { EXCHANGE_TO_DP, TYPE_TO_CHANNEL, wsTransport } from '../transport/markprice'

export const inputParameters = new InputParameters(
  {
    exchange: {
      description: 'The exchange to obtain the market price from',
      required: true,
      type: 'string',
      options: Object.keys(EXCHANGE_TO_DP) as (keyof typeof EXCHANGE_TO_DP)[],
    },
    base: {
      aliases: ['symbol'],
      description: 'The symbol of the base quote asset pair',
      required: true,
      type: 'string',
    },
    type: {
      description: 'The type of the price to obtain',
      required: true,
      type: 'string',
      options: Object.keys(TYPE_TO_CHANNEL) as (keyof typeof TYPE_TO_CHANNEL)[],
    },
  },
  [
    {
      exchange: 'binance',
      base: 'BTCUSDT',
      type: 'mark_price',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid: number
      bid: number
      ask: number
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'markprice',
  transport: wsTransport,
  inputParameters,
  requestTransforms: [
    (request) =>
      (request.requestContext.data.base = request.requestContext.data.base.toUpperCase()),
  ],
})
