import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'eod'

const customParams = {
  ticker: ['base', 'from', 'symbol', 'ticker'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const field = validator.validated.data.field || 'close'
  const url = `daily/${ticker.toLowerCase()}/prices`

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
    },
    url,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [0, field])

  return Requester.success(jobRunID, response, config.verbose)
}
