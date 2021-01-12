import { util } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'globalMarketCap'

const marketcapParams = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, marketcapParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const convert = validator.validated.data.market.toUpperCase()
  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const params = { convert }
  const headers = {
    'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
  }

  const options = {
    ...config.api,
    url,
    params,
    headers,
  }
  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [
    'data',
    'quote',
    convert,
    'total_market_cap',
  ])
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
