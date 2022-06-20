import * as JSONRPC from '@chainlink/json-rpc-adapter'
import type { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Validator, Requester, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from '../config'

export const NAME = 'getblockchaininfo'
const DEFAULT_FIELD = 'difficulty'

export const supportedEndpoints = [NAME, 'difficulty', 'height']

export const endpointResultPaths = {
  getblockchaininfo: DEFAULT_FIELD,
  difficulty: DEFAULT_FIELD,
  height: 'blocks',
}

export const description = 'Calls `"method": "getblockchaininfo"` on the Bitcoin node.'

export type TInputParameters = JSONRPC.types.request.TInputParameters
export const inputParameters = JSONRPC.types.request.inputParameters

export interface ResponseSchema {
  data: {
    result: {
      chain: string
      blocks: number
      headers: number
      bestblockhash: string
      difficulty: number
      mediantime: number
      verificationprogress: number
      initialblockdownload: boolean
      chainwork: string
      size_on_disk: number
      pruned: boolean
      warnings: string
    }
  }
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath?.toString() || DEFAULT_FIELD

  const _execute = JSONRPC.makeExecute(config)
  let response
  try {
    response = await _execute(
      {
        ...request,
        data: { ...validator.validated.data, method: NAME, endpoint: 'request' },
      },
      context,
    )
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'bitcoin',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  response.data.result = Requester.validateResultNumber(response.data, ['result', resultPath])
  return Requester.success(jobRunID, response)
}
