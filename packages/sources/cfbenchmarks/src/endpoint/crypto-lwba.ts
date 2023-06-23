import { additionalInputValidation, inputParameters } from './crypto'
import { getSecondaryId } from './utils'
import { wsTransport } from '../transport/crypto-lwba'
import { config } from '../config'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
export interface EPResponse {
  Result: number
  Data: {
    bid: number
    ask: number
    mid: number
    midPrice: number
    utilizedDepth: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EPResponse
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

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba'],
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms: [lwbaReqTransformer],
})
