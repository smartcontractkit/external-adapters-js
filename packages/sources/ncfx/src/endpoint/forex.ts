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

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export function customInputValidation(
  _: AdapterRequest<typeof inputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (!settings.FOREX_WS_USERNAME || !settings.FOREX_WS_PASSWORD) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'Forex endpoint credentials are not set',
    })
  }
  return
}

export const forexEndpoint = new ForexPriceEndpoint({
  name: 'forex',
  transport,
  inputParameters,
  customInputValidation,
})
