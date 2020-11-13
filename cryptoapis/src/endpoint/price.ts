import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, getBaseURL } from '../config'

export const Name = 'price'

const priceParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/v1/exchange-rates/${coin}/${market}`

  const reqConfig = { ...config.api, baseURL: getBaseURL(), url }

  try {
    const response = await Requester.request(reqConfig)
    response.data.result = Requester.validateResultNumber(response.data, [
      'payload',
      'weightedAveragePrice',
    ])
    return response
  } catch (error) {
    throw Requester.errored(jobRunID, error)
  }
}
