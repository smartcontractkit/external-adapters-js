import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'ticker']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export interface ResponseSchema {
  symbol: string
  price: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName)
  if (Array.isArray(base)) base = base[0]
  const quote = validator.validated.data.quote
  const symbol = `${base.toUpperCase()}${quote.toUpperCase()}`
  const url = `/api/v3/ticker/price`

  const params = {
    symbol,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['price'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
