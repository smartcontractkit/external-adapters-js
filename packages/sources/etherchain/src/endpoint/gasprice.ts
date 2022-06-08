import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

export const inputParameters: InputParameters = {
  speed: {
    required: false,
    type: 'string',
    description: 'The desired speed',
    options: ['safeLow', 'standard', 'fast', 'fastest'],
    default: 'standard',
  },
}

interface ResponseSchema {
  code: number
  data: {
    rapid: number
    fast: number
    standard: number
    slow: number
    timestamp: number
    priceUSD: number
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = `/api/gasnow`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['data', speed])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
