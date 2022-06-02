import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['price']

export interface ResponseSchema {
  data: {
    asset: string
    time: string
    ReferenceRateUSD?: string
    ReferenceRateEUR?: string
  }[]
  error?: {
    type: string
    message: string
  }
}

const customError = (data: ResponseSchema) => !!data.error

export const description = 'Endpoint to get the reference price of the asset.'

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
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
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const quote = validator.validated.data.quote
  const url = 'timeseries/asset-metrics'
  const metric = `ReferenceRate${quote.toUpperCase()}`

  const params = {
    assets: base,
    metrics: metric,
    frequency: '1s',
    api_key: config.apiKey,
    page_size: 1,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['data', 0, metric])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
