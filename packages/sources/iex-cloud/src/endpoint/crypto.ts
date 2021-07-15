import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'asset', 'symbol'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const url = `crypto/${base.toUpperCase()}${quote.toUpperCase()}/quote`

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['latestPrice'])

  return Requester.success(jobRunID, response, config.verbose)
}
