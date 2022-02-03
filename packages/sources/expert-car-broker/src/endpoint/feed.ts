import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['feed']

export const inputParameters: InputParameters = {
  product: {
    required: true,
    description: 'The product to query',
    type: 'string',
  },
  feedId: {
    required: true,
    description: 'The feed ID to use',
    type: 'number',
  },
}

export interface ResponseSchema {
  value: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const product = validator.validated.data.product
  const feedId = validator.validated.data.feedId
  const url = `${product}/feed-${feedId}`

  const params = {
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, ['value'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
