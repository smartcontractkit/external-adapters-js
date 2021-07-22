import JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'getblockchaininfo'
const DEFAULT_FIELD = 'difficulty'

const inputParams = {
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

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

  response.data.result = Requester.validateResultNumber(response.data, ['result', resultPath])
  return Requester.success(jobRunID, response)
}
