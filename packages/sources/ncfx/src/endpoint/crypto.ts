import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/crypto'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

// Note: this adapter is intended for the API with endpoint 'wss://cryptofeed.ws.newchangefx.com'.
// There is another API with endpoint 'wss://feed.newchangefx.com/cryptodata' that has slightly
// different behavior, including a different login success message and the price messages being
// an array of price data objects for each subscribed asset.

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export function customInputValidation(
  _: AdapterRequest<typeof inputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (!settings.API_PASSWORD || !settings.API_USERNAME) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'API_PASSWORD and/or API_USERNAME is not set',
    })
  }
  return
}

export const cryptoEndpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  transport,
  customInputValidation,
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
})
