import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const Name = 'example'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const base = validator.validated.data.base
  const quote = validator.validated.data.quote
  const url = `price`

  const params = {
    base,
    quote,
  }

  const reqConfig = { ...config.api, params, baseURL: 'http://localhost:18081', url }

  const response = await Requester.request(reqConfig, customError)
  return Requester.validateResultNumber(response.data, ['price'])
}
