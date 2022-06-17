import { AxiosRequestConfig, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['dataquery']

const customError = (data: ResponseSchema) => data.status !== '200'

export const description = 'Retrieves price data for a given currency pair.'

export type TInputParameters = { base: string; quote: string; field: string }

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
    required: true,
  },
  field: {
    description: 'The object path to access the value that will be returned as the result',
    default: 'result',
    type: 'string',
  },
}

export interface ResponseSchema {
  data: {
    from_symbol: string
    last_refreshed: string
    rate: string
    result: string
    time_zone: string
    to_symbol: string
  }
  jobRunID: string
  result: string
  status: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const resultPath = validator.validated.data.resultPath
  const url = '/data-query'
  const host = 'alpha-chain2.p.rapidapi.com'
  const headers = {
    'content-type': 'application/octet-stream',
    'x-rapidapi-host': host,
    'x-rapidapi-key': config.apiKey || '',
  }

  const params = {
    from_symbol: base,
    to_symbol: quote,
    chainlink_node: true,
  }

  const options: AxiosRequestConfig = {
    ...config.api,
    url,
    params,
    headers,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
