import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/stock-quotes'
import { inputParameters } from './utils'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
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
  inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation: (_, settings): AdapterError | undefined => {
    if (!settings.WS_API_ENDPOINT) {
      return new AdapterInputError({
        statusCode: 400,
        message: 'WS_API_ENDPOINT is not set',
      })
    }
    return
  },
})
