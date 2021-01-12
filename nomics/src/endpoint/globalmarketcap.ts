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
    key: util.getRandomRequiredEnv('API_KEY'),
  }

  const reqConfig = {
    ...config.api,
    params,
    baseURL: 'https://api.nomics.com/v1/global-ticker',
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['market_cap'])
  return response.data
}
