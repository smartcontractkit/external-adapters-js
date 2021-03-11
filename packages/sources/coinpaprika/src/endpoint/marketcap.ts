import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'globalmarketcap'

const inputParams = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol = validator.validated.data.market.toLowerCase()

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [`market_cap_${symbol}`])

  return Requester.success(jobRunID, response, config.verbose)
}
