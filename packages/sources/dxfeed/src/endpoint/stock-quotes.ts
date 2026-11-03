import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/stock-quotes'
import { inputParameters, validateWsSettings } from './utils'

export const stockQuotesInputParameters = new InputParameters({
  ...inputParameters.definition,
  requireVolume: {
    default: false,
    description: 'If true, throw error if bid/ask volume is invalid',
    type: 'boolean',
  },
  isOvernight: {
    default: false,
    description: 'If true, only accept O exchange codes for bid and ask',
    type: 'boolean',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof stockQuotesInputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: number
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number | null
      ask_price: number
      ask_volume: number | null
    }
  }
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: [],
  transport,
  inputParameters: stockQuotesInputParameters,
  overrides: overrides.dxfeed,
  customInputValidation: (_, settings) => validateWsSettings(settings),
})
