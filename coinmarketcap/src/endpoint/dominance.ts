import { util } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'dominance'

const dominanceParams = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, dominanceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const headers = {
    'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
  }

  const options = {
    ...config.api,
    url,
    headers,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['data', dataKey])
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
