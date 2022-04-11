import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['marketcap', 'mc']

export const endpointResultPaths = {
  marketcap: 'marketcap',
  mc: 'marketcap',
}

export interface ResponseSchema {
  data: {
    marketcap: number
  }
}

const customError = (data: any) => data.Response === 'Error'

export const description = 'Marketcap endpoint, which has many optional input parameters.'

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
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    exclusive: ['referenceCurrencyUuid'],
    required: false,
    type: 'number',
  },
  resultPath: {
    description: 'The path for the result',
    default: 'result',
    options: ['address', 'addresses', 'marketcap', 'result', 'results'],
    required: false,
    type: 'string',
  },
  referenceCurrencyUuid: {
    description: 'The reference currency UUID to utilize',
    exclusive: ['coinid'],
    required: false,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const url = `marketcap`
  const resultPath = validator.validated.data.resultPath

  const params = {
    base,
    quote,
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
