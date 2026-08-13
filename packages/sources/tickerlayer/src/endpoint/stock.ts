import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/stock'

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
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock',
  aliases: ['price'],
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
