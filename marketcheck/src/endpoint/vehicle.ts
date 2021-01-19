import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'vehicle'

const customParams = {
  year: true,
  make: true,
  model: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { year, make, model } = validator.validated.data

  const ymm = `${year}|${make}|${model}`

  const params = {
    api_key: config.apiKey,
    ymm,
  }

  const reqConfig = { ...config.api, params, url: 'sales/car' }
  const response = await Requester.request(reqConfig)
  // TODO: find path
  const path = ['price']
  const result = Requester.validateResultNumber(response.data, path)

  return Requester.success(jobRunID, {
    data: { result, ...response.data },
    result,
    status: 200,
  })
}
