import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['feed']

export type TInputParameters = { product: string; feedId: number }
export const inputParameters: InputParameters<TInputParameters> = {
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
  const url = util.buildUrlPath(':product/feed-:feedId', { product, feedId })

  const params = {
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
