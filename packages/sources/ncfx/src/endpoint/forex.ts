import {
  ForexPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/forex'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'CAD',
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
  if (!settings.FOREX_WS_API_KEY) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'FOREX_WS_API_KEY is not set',
    })
  }
  return
}

export const forexEndpoint = new ForexPriceEndpoint({
  name: 'forex',
  transport,
  inputParameters,
  customInputValidation,
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
})
