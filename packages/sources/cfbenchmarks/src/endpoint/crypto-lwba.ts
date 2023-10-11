import { additionalInputValidation, inputParameters } from './crypto'
import { getSecondaryId } from './utils'
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
  additionalInputValidation(req.requestContext.data)

  if (!req.requestContext.data.index) {
    req.requestContext.data.index = getSecondaryId(
      req.requestContext.data.base as string,
      req.requestContext.data.quote as string,
    )
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
})
