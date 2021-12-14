import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import { ResponseSchema } from './forex'

export const supportedEndpoints = ['crypto']

export const inputParams: InputParameters = {
  base: ['base', 'from', 'symbol'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const url = `/last/crypto/${from}${to}`
  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
