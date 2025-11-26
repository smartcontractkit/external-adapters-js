import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/stock-quotes'
import { stockInputParameters } from './utils'

export type BaseEndpointTypes = {
  Parameters: typeof stockEndpointInputParametersDefinition
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
  transport,
  inputParameters: stockInputParameters,
  overrides: overrides.finage,
})
