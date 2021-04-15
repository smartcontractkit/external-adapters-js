// Coinmarketcap DOCK/USD price API

import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'Coinmarketcap'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const symbol = 'DOCK'
  const convert = 'USD'

  const params = {
    symbol,
    // this can be avoided as USD is default but still being explicit
    convert,
  }

  const options = {
    ...config.api, // Need the api object as it has header with the API key
    url,
    params,
  }

  const response = await Requester.request(options)

  // The price is found at path `data.DOCK.quote.USD.price` in response JSON
  const result = Requester.validateResultNumber(response.data, [
    'data',
    'DOCK',
    'quote',
    'USD',
    'price',
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
