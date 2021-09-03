import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME } from '../config'

export const supportedEndpoints = ['live']

const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  to: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
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
