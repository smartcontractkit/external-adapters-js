import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'globalmarketcap'

const marketcapParams = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, marketcapParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const convert = validator.validated.data.market.toUpperCase()
  const url = '/global-metrics/quotes/latest'

  const params = { convert }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    'quote',
    convert,
    'total_market_cap',
  ])
  return Requester.success(jobRunID, response, config.verbose)
}
