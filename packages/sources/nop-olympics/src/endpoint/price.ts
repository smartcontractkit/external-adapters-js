import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['price']

export interface ResponseSchema {
  data: {
    price: number
  }
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const options = { ...config.api }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
