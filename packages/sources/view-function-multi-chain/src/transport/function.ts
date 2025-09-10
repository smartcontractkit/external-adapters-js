import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/function'
import { createMultiChainFunctionTransport, RawOnchainResponse } from './function-common'

/* eslint-disable @typescript-eslint/no-unused-vars */
export function hexResultPostProcessor(
  onchainResponse: RawOnchainResponse,
  _resultField?: string | undefined,
): AdapterResponse<BaseEndpointTypes['Response']> {
  const { encodedResult, timestamps } = onchainResponse

  return {
    data: {
      result: encodedResult,
    },
    statusCode: 200,
    result: encodedResult,
    timestamps,
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const functionTransport =
  createMultiChainFunctionTransport<BaseEndpointTypes>(hexResultPostProcessor)
