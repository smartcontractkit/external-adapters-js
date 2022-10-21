import { ExecuteWithConfig, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, NAME as AdapterName } from '../config'
import { getExampleEAResult } from '../dataProvider'

export const supportedEndpoints = ['example']

export const endpointResultPaths = {
  price: 'price',
}

export interface ResponseSchema {
  Response?: string // for errors
  data: {
    // Some data
  }
}

const customError = (data: ResponseSchema) => data.Response === 'Error'

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

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const quote = validator.overrideSymbol(AdapterName, validator.validated.data.quote)
  const url = `example`
  const resultPath = validator.validated.data.resultPath

  // Retrieve data from another external adapter
  const exampleResult = await getExampleEAResult(jobRunID, base, quote, context)

  // Perform logic to transform results if needed
  // ...

  const params = {
    data: exampleResult,
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
