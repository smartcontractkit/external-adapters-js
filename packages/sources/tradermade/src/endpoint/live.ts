import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME } from '../config'

export const supportedEndpoints = ['live', 'commodities']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'symbol', 'market'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  to: {
    required: false,
    description: 'The quote currency',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()

  /**
   * Note that currency can also mean equity.  This is why "to" is not a required variable
   */
  const to = (validator.validated.data.to || '').toUpperCase()
  const currency = `${symbol}${to}`

  const params = {
    ...config.api.params,
    currency,
  }

  const options = { ...config.api, params }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, response, config.verbose)
}
