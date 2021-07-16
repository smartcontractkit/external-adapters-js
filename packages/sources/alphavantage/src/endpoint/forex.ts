import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['forex', 'price']

const customError = (data: any) => {
  if (data['Error Message']) return true
  return false
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote

  const params = {
    ...config.api.params,
    function: 'CURRENCY_EXCHANGE_RATE',
    from_currency: from,
    to_currency: to,
    from_symbol: from,
    to_symbol: to,
    symbol: from,
    market: to,
  }

  const options = {
    ...config.api,
    params,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [
    'Realtime Currency Exchange Rate',
    '5. Exchange Rate',
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
