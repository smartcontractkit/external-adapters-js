import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  speed: {
    required: false,
    description: 'The desired speed',
    type: 'string',
    options: ['safeLow', 'average', 'fast', 'fastest'],
    default: 'average',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = `/api/v1/egs/api/ethgasAPI.json?`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e8

  return Requester.success(jobRunID, response, config.verbose)
}
