import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

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

export const customInputValidation = (
  request: AdapterRequest<typeof inputParameters.validated>,
): undefined => {
  const { assetType } = request.requestContext.data
  if (!/^[a-zA-Z]+$/.test(assetType)) {
    throw new Error(`Asset type must contain only letters. Found '${assetType}'.`)
  }
  return
}
