import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['example']

export const endpointResultPaths = {
  example: 'price',
}

export interface ResponseSchema {
  data: {
    // Some data
  }
}

const customError = (data: Record<string, unknown>) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  // See InputParameters type for more config options
  base: {
    aliases: ['from', 'coin'],
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

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

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, [resultPath])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
