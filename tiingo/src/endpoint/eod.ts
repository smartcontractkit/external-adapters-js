import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'eod'

const customParams = {
  ticker: true,
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const field = validator.validated.data.field || 'close'
  const url = `daily/${ticker.toLowerCase()}/prices`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, [0, field])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
