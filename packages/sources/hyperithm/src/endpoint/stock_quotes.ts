import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { invalidSymbols, wsTransport } from '../transport/stock_quotes'

export const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: '700/HKD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
      last_price: number
      timestamp_iso: string // for troubleshooting
    }
  }
  Settings: typeof config.settings
}

const symbolRegex = /^[A-Z0-9]+\/[A-Z0-9]+$/

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: [],
  transport: wsTransport,
  inputParameters,
  customInputValidation: (request): undefined => {
    const symbol = request.requestContext.data.base
    if (invalidSymbols.has(symbol)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Symbol '${symbol}' is invalid.`,
      })
    }
    if (!symbolRegex.test(symbol)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Symbol must match ${symbolRegex}. Found '${symbol}'.`,
      })
    }
    return
  },
})
