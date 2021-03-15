import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'dominance'

const dominanceParams = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, dominanceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const url = 'global-metrics/quotes/latest'

  const options = {
    ...config.api,
    url,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['data', dataKey])
  return Requester.success(jobRunID, response, config.verbose)
}
