import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'avg-price'

const customParams = {
  refNumber: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const refNumber = validator.validated.data.refNumber
  const url = `watch/referencenumber/${refNumber}`

  const options = {
    ...config.api,
    headers: { ...config.api.headers, 'X-API-KEY': config.apiKey },
    url,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['data', 0, 'avg_price'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
