import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { wsTransport } from '../transport/stock_quotes'
import { customInputValidation, inputParameters } from './common'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
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
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: ['quotes'],
  transport: wsTransport,
  inputParameters,
  customInputValidation,
})
