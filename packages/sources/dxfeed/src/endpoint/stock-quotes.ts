import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, wsEnvInputValidationError } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/stock-quotes'
import { inputParameters } from './utils'

export const stockQuotesInputParameters = new InputParameters({
  ...inputParameters.definition,
  base: {
    aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
    description:
      'The symbol of the stock to query, append `:USLF24` to the end for after hours on ws endpoints',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    description: 'The quote currency of the stock quote',
    required: true,
    type: 'string',
  },
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
  inputParameters: stockQuotesInputParameters,
  overrides: overrides.dxfeed,
  // stock_quotes is a WS-only path: the spec breaking_change_env_checks run at
  // request time too (same check fns as the startup AdapterConfig validate)
  customInputValidation: (_request, settings) => wsEnvInputValidationError(settings),
})
