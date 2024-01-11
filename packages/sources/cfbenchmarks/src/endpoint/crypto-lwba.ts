import { inputParameters } from './crypto'
import { customInputValidation, getSecondaryId } from './utils'
import { wsTransport } from '../transport/crypto-lwba'
import { config } from '../config'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { LwbaEndpoint, LwbaResponseDataFields } from '@chainlink/external-adapter-framework/adapter'

export type BaseEndpointTypes = {
  // leaving Parameters as crypto inputParameters for backward compatibility
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const lwbaReqTransformer = (req: AdapterRequest<typeof inputParameters.validated>): void => {
  const { base, quote, index } = req.requestContext.data
  if (base?.endsWith('_RTI')) {
    // If 'base' ends with _RTI it means the value is overridden, use that value for index
    req.requestContext.data.index = base
  } else if (!index) {
    req.requestContext.data.index = getSecondaryId(base as string, quote as string)
  }

  // Clear base quote to ensure an exact match in the cache with index
  delete req.requestContext.data.base
  delete req.requestContext.data.quote
}

export const endpoint = new LwbaEndpoint({
  name: 'crypto-lwba',
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms: [lwbaReqTransformer],
  customInputValidation,
})
