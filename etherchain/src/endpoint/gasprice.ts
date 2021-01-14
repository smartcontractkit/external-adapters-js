import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const Name = 'gasPriceOracle'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  speed: true,
  endpoint: false,
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint || 'gasPriceOracle'
  const speed = validator.validated.data.speed || 'standard'
  const url = `https://www.etherchain.org/api/${endpoint}`

  const reqConfig = {
    ...config.api,
    url,
  }

  const response = await Requester.request(reqConfig, customError)
  return Requester.validateResultNumber(response.data, [speed]) * 1e9
}
