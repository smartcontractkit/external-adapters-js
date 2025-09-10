import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/function-response-selector'
import { createMultiChainFunctionTransport, RawOnchainResponse } from './function-common'

function decodedResultSelectorPostProcessor(
  onchainResponse: RawOnchainResponse,
  resultField?: string | undefined,
): AdapterResponse<BaseEndpointTypes['Response']> {
  if (!resultField) {
    throw new AdapterInputError({
      message: 'Missing resultField input param',
      statusCode: 400,
    })
  }

  const { iface, fnName, encodedResult, timestamps } = onchainResponse
  const decodedResult = iface.decodeFunctionResult(fnName, encodedResult)
  if (decodedResult[resultField] == null) {
    throw new AdapterInputError({
      message: 'Invalid resultField not found in response',
      statusCode: 400,
    })
  }
  const result = BigInt(decodedResult[resultField]).toString()

  return {
    data: {
      result,
    },
    statusCode: 200,
    result,
    timestamps,
  }
}

export const multiChainFunctionResponseSelectorTransport =
  createMultiChainFunctionTransport<BaseEndpointTypes>(decodedResultSelectorPostProcessor)
