import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint.
// The supportedEndpoints list must be present for README generation.
export const supportedEndpoints = ['example']

export const endpointResultPaths = {
  example: 'price',
}

export interface ResponseSchema {
  Response?: string // for errors
  data: {
    // Some data
  }
}

const customError = (data: ResponseSchema) => data.Response === 'Error'

// The description string is used to explain how the endpoint works, and is used for part of the endpoint's README section
export const description = 'This is an example endpoint description for example adapter.'

// The inputParameters object must be present for README generation.
export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  // See InputParameters type for more config options
  base: {
    aliases: ['from', 'coin'],
    description: 'Base asset to convert',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'Quote asset to convert to',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
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
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
