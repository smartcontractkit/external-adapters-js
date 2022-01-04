import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['ticker', 'crypto']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  resultPath: {
    description: 'The object path to access the value that will be returned as the result',
    default: 'vwap',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath || 'vwap'
  const url = `ticker`
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const book = `${base}_${quote}`

  const params = { book }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
