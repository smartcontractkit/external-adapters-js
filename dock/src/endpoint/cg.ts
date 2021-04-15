// Coingecko DOCK/USD price API

import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'Coingecko'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://api.coingecko.com/api/v3/simple/price'
  const ids = 'DOCK'
  const vs_currencies = 'USD'

  const params = {
    ids,
    vs_currencies,
  }

  const options = {
    url,
    params,
  }

  const response = await Requester.request(options)

  // The price is found at path `dock.usd` in response JSON
  const result = Requester.validateResultNumber(response.data, ['dock', 'usd'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
