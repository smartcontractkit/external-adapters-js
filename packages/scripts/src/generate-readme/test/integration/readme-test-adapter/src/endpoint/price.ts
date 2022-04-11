import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['price', 'convert']

export const endpointResultPaths = {
  price: 'price',
  convert: 'price',
}

export interface ResponseSchema {
  data: {
    price: number
  }
}

const customError = (data: any) => data.Response === 'Error'

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
  amount: {
    aliases: ['value'],
    description: 'Amount of currency to price',
    required: false,
    type: 'number',
    dependsOn: ['resultPath'],
  },
  resultPath: {
    description: 'The path for the result',
    default: 'result',
    options: ['address', 'addresses', 'price', 'result', 'results'],
    required: false,
    type: 'string',
    dependsOn: ['amount'],
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const url = `price`
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
