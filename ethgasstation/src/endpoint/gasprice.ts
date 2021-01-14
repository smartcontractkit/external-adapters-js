import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'ethgasAPI'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  speed: false,
  endpoint: false,
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint || 'ethgasAPI'
  const speed = validator.validated.data.speed || 'average'
  const url = `https://data-api.defipulse.com/api/v1/egs/api/${endpoint}.json?`
  const reqConfig = {
    ...config.api,
    url,
    params: {
      'api-key': util.getRandomRequiredEnv('API_KEY'),
    },
    timeout: 10000,
  }
  const response = await Requester.request(reqConfig, customError)
  // console.log(response.data)
  return Requester.validateResultNumber(response.data, [speed]) * 1e8
}
