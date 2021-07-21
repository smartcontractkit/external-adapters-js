import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
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

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
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
