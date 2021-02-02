import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const Name = 'globalmarketcap'

const customError = (data: any) => data.Response === 'Error'

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, {})
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const url = `/global-ticker`

  const params = {
    key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data, ['market_cap'])
  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
