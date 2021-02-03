import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'price'

const customError = (data: any) => {
  if (data['Error Message']) return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const params = {
    function: 'CURRENCY_EXCHANGE_RATE',
    from_currency: from,
    to_currency: to,
    from_symbol: from,
    to_symbol: to,
    symbol: from,
    market: to,
    apikey: util.getRandomRequiredEnv('API_KEY'),
  }

  const options = {
    ...config.api,
    params,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [
    'Realtime Currency Exchange Rate',
    '5. Exchange Rate',
  ])

  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
