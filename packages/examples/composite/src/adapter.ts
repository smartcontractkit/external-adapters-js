import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'

const customParams = {}

export const execute = async (input: AdapterRequest): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)

  const jobRunID = validator.validated.jobRunID

  const response = { data: {}, status: 200 }
  return HTTP.success(jobRunID, response)
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request)
}
