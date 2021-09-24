import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'ticker']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  resultPath: false,
}

export const endpointResultPaths = {
  crypto: 'last',
  ticker: 'last',
}

interface ResponseSchema {
  ask: string
  bid: string
  last: string
  low: string
  high: string
  open: string
  volume: string
  volume_quote: string
  timestamp: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const resultPath = validator.validated.data.resultPath
  const market = base + quote
  const url = `public/ticker/${market}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
