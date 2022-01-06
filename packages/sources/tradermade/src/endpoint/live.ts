import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME } from '../config'

export const supportedEndpoints = ['live', 'commodities']

const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  to: false,
}

export interface ResponseSchema {
  endpoint: string
  quotes: {
    ask: number
    base_currency: string
    bid: number
    mid: number
    quote_currency: string
  }[]
  requested_time: string
  timestamp: number
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

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
