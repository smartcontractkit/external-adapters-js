import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/stock_quotes'

export const inputParameters = new InputParameters(
  {
    ...stockEndpointInputParametersDefinition,
    assetType: {
      description:
        'The asset type is used to determine what channel to subscribe to. The Tickerlayer API supports "stocks", "fores", "crypto", "indices", "etfs", and "commodities".',
      type: 'string',
      default: 'stocks',
      // We don't restrict to specific options in order to support future
      // assets types without code changes.
    },
  },
  [
    {
      base: 'US:AAPL',
      assetType: 'stocks',
    },
  ],
)

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
  customInputValidation: (request): undefined => {
    const { assetType } = request.requestContext.data
    if (!/^[a-zA-Z]+$/.test(assetType)) {
      throw new Error(`Asset type must contain only letters. Found '${assetType}'.`)
    }
    return
  },
})
