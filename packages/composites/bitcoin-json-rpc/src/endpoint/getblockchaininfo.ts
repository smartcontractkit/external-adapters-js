import * as JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { Validator, HTTP } from '@chainlink/ea-bootstrap'

export const NAME = 'getblockchaininfo'
const DEFAULT_FIELD = 'difficulty'

export const description = 'Calls `"method": "getblockchaininfo"` on the Bitcoin node.'

const inputParams = {
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  const jobRunID = validator.validated.id
  const resultPath =
    validator.validated.data.endpoint == DEFAULT_FIELD
      ? DEFAULT_FIELD
      : validator.validated.data.resultPath || DEFAULT_FIELD

  const response = await JSONRPC.execute(
    {
      ...request,
      data: { ...request.data, method: NAME },
    },
    context,
    config,
  )

  response.data.result = HTTP.validateResultNumber(response.data, ['result', resultPath])
  return HTTP.success(jobRunID, response)
}
