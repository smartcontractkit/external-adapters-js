import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['forex', 'price']

const customError = (data: any) => {
  if (data['Error Message']) return true
  return false
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description:
      'The symbol of the currency to query. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description:
      'The symbol of the currency to convert to. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
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
