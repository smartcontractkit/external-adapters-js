import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { makeConfig, Config } from './config'

const customParams = {}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID

  const response = { data: {}, status: 200 }
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
