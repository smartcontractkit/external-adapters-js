import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'price'

const inputParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'latest.json'
  const base = validator.validated.data.base
  const to = validator.validated.data.quote

  const params = {
    base,
    app_id: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['rates', to])

  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
