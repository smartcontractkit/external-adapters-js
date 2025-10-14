import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

export type BaseCryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export function tiingoCommonSubscriptionRequestTransform() {
  return (req: AdapterRequest<{ base: string; quote: string }>) => {
    req.requestContext.data.base = req.requestContext.data.base.toLowerCase()
    req.requestContext.data.quote = req.requestContext.data.quote.toLowerCase()
  }
}
