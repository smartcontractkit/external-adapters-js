// Cryptocompare DOCK/USD price API

import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'Cryptocompare'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://min-api.cryptocompare.com/data/price'
  const fsym = 'DOCK'
  const tsyms = 'USD'

  const params = {
    fsym,
    tsyms,
  }

  const options = {
    url,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [tsyms])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
