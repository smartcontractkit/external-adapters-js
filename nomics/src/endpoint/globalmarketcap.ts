import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'globalmarketcap'

const customError = (data: any) => data.Response === 'Error'

export const execute = async (config: Config, request: AdapterRequest) => {
  //is this needed?
  const validator = new Validator(request, {})
  if (validator.error) throw validator.error

  const params = {
    key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['market_cap'])
  return response.data
}
