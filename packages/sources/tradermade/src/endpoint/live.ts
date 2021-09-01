import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const supportedEndpoints = ['live']

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'market_cap',
}

const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  to: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const to = (validator.validated.data.to || '').toUpperCase()
  const currency = symbol + to
  const params = {
    ...config.api.params,
    currency,
  }
  const options = { ...config.api, params }
  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, response)
}
