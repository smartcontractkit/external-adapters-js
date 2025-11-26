import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/stock-quotes'

const inputParameters = new InputParameters(stockEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
