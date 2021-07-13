import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const supportedEndpoints = ['feed']

const customParams = {
  product: true,
  feedId: true
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const product = validator.validated.data.product
  const feedId = validator.validated.data.feedId
  const url = `${product}/feed-${feedId}`

  const params = {
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, response, config.verbose)
}
