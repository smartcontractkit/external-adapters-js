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
  const rawRequestData = req.body.data
  // If `base` in requestContext.data is not the same as in raw request data, it means the value is overriden, use that for index
  const baseAliases = ['base', ...inputParameters.definition.base.aliases]
  if (baseAliases.every((alias) => base !== rawRequestData[alias])) {
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
