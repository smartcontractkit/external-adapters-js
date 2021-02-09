import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAMES = ['price']

const priceParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/v1/exchange-rates/${coin}/${market}`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [
    'payload',
    'weightedAveragePrice',
  ])
  return Requester.success(jobRunID, response)
}
