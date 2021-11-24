import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'

export const supportedEndpoints = ['forex']

export const inputParams: InputParameters = {
  base: ['base', 'from', 'symbol'],
  quote: ['quote', 'to', 'market'],
}

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const url = `/last/forex/${from}${to}`
  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const ask = Requester.validateResultNumber(response.data, ['ask'])
  const bid = Requester.validateResultNumber(response.data, ['bid'])
  const result = (ask + bid) / 2
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
