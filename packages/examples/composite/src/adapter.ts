import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/ea-bootstrap'

const customParams = {}

export const execute = async (input: AdapterRequest): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)

  const jobRunID = validator.validated.id

  const response = { data: {}, status: 200 }
  return Requester.success(jobRunID, response)
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request)
}
