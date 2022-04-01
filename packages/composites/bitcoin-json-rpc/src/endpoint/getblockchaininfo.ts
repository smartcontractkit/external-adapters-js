import * as JSONRPC from '@chainlink/json-rpc-adapter'
import type { Config, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Validator, Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'getblockchaininfo'
const DEFAULT_FIELD = 'result.difficulty'

export const supportedEndpoints = [NAME, 'difficulty']

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

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)
  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath || DEFAULT_FIELD

  const _execute = JSONRPC.makeExecute(config)
  const response = await _execute(
    {
      ...request,
      data: { ...validator.validated.data, method: NAME },
    },
    context,
  )

  response.data.result = Requester.validateResultNumber(response.data, resultPath)
  return Requester.success(jobRunID, response)
}
