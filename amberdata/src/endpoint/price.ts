import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, getBaseURL } from '../config'

export const Name = 'price'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/api/v2/market/spot/prices/pairs/${coin.toLowerCase()}_${market.toLowerCase()}/latest`

  const params = {
    includeCrossRates: true,
  }

  const reqConfig = { ...config.api, params, baseURL: getBaseURL(), url }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', 'price'])
  return response
}
