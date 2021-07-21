import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

const customError = (data: any) => data.Response === 'Error'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths = {
  height: 'height',
  difficulty: 'difficulty',
}

export const inputParameters: InputParameters = {
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const url = `/blocks`

  const options = {
    ...config.api,
    url,
    timeout: 10000,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [0, resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
