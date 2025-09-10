import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/function-response-selector'
import { createMultiChainFunctionTransport, RawOnchainResponse } from './function-common'

function selectFieldFromDecodedResult(
  onchainResponse: RawOnchainResponse,
  resultField?: string | undefined,
): string {
  if (!resultField) {
    throw new AdapterInputError({
      message: 'Missing resultField input param',
      statusCode: 400,
    })
  }

  const { iface, fnName, encodedResult } = onchainResponse
  const decodedResult = iface.decodeFunctionResult(fnName, encodedResult)
  if (decodedResult[resultField] == null) {
    throw new AdapterInputError({
      message: 'Invalid resultField not found in response',
      statusCode: 400,
    })
  }
  return BigInt(decodedResult[resultField]).toString()
}

export const multiChainFunctionResponseSelectorTransport =
  createMultiChainFunctionTransport<BaseEndpointTypes>(selectFieldFromDecodedResult)
