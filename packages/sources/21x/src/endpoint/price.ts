import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { customSubscriptionTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['id'],
      required: true,
      type: 'string',
      description: 'The id of the trading pair',
    },
  },
  [
    {
      base: '09befe9e-c95d-4856-ab4c-c811202a9cfb',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string // last_price
    Data: {
      last_price: string
      mid_price: string | undefined
      bid_price: string | undefined
      bid_volume: string | undefined
      ask_price: string | undefined
      ask_volume: string | undefined
      market_status: number
      trading_status_string: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: customSubscriptionTransport,
  inputParameters,
})
