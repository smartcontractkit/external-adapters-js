import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/stock_quotes'
import { customInputValidation, inputParameters } from './common'

export const stockQuotesInputParameters = new InputParameters({
  ...inputParameters.definition,
  isOvernight: {
    default: false,
    description: 'If true, report overnight session data',
    type: 'boolean',
  },
  requireVolume: {
    default: false,
    description: 'If this and isOvernight are true, throw error if bid/ask volume is invalid',
    type: 'boolean',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof stockQuotesInputParameters.definition
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number | undefined
      ask_price: number
      ask_volume: number | undefined
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: ['quotes'],
  transport: wsTransport,
  inputParameters: stockQuotesInputParameters,
  customInputValidation,
})
