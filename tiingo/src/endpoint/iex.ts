import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'iex'

const customParams = {
  ticker: ['ticker', 'base', 'from', 'coin'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const field = validator.validated.data.field || 'tngoLast'
  const url = `${NAME}/${ticker}`
  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers: ticker,
    },
    url,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [0, field])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
