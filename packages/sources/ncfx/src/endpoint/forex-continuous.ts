import {
  AdapterEndpoint,
  LwbaResponseDataFields,
  lwbaEndpointInputParametersDefinition,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterLWBAError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { transport } from '../transport/forex-continuous'
import { customInputValidation } from './crypto'

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition, [
  {
    base: 'ARS',
    quote: 'USD',
  },
])

export type BaseEndpointTypesForexContinuous = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const forexContinuousEndpoint = new AdapterEndpoint({
  name: 'forex-continuous',
  aliases: ['forex_continuous', 'forexcontinuous'],
  customInputValidation,
  transport,
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
  customOutputValidation: (output) => {
    const data = output.data as { bid: number; mid: number; ask: number }
    const error = validateLwbaResponse(data.bid, data.mid, data.ask)
    if (error) {
      throw new AdapterLWBAError({ statusCode: 500, message: error })
    }
    return undefined
  },
})
