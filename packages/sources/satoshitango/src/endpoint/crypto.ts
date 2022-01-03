import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'ticker']

export const endpointResultPaths = {
  crypto: 'bid',
  ticker: 'bid',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
  resultPath: {
    required: false,
    description: 'The object path to access the value that will be returned as the result.',
    default: 'bid',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const url = `ticker/${quote}`
  const resultPath = validator.validated.data.resultPath

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    'ticker',
    base,
    resultPath,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
