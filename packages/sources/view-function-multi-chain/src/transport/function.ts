import { BaseEndpointTypes } from '../endpoint/function'
import { createMultiChainFunctionTransport } from './function-common'

export const functionTransport = createMultiChainFunctionTransport<BaseEndpointTypes>(
  (rawResponse) => rawResponse.encodedResult,
)
