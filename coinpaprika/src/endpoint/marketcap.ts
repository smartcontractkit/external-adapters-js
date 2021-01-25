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
  const url = 'https://api.coinpaprika.com/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol = validator.validated.data.market.toLowerCase()

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [`market_cap_${symbol}`])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
