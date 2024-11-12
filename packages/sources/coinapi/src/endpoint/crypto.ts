import {
  AdapterBatchResponse,
  AxiosResponse,
  CacheKey,
  DefaultConfig,
  Requester,
  ResultPath,
  util,
  Validator,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, AdapterRequest, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price']
export const batchablePropertyPath = [{ name: 'quote' }]

// Override utilizes the Assets endpoint to batch on base when quote is USD
// Crypto endpoint batches on quote for all other quotes
export const endpointOverride = (request: AdapterRequest): string | null => {
  const validator = new Validator(request, inputParameters)
  if (
    !Array.isArray(validator.validated.data.quote) &&
    validator.validated.data.quote?.toUpperCase() === 'USD'
  )
    return 'assets'
  return null
}

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export type TInputParameters = {
  base: string
  quote: string | string[]
}

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
    description: 'The symbol of the currency to query [crypto](#Crypto-Endpoint)',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

export interface ResponseSchema {
  asset_id_base: string
  rates: Rate[]
}

export interface Rate {
  time: string
  asset_id_quote: string
  rate: number
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  validator: Validator<TInputParameters>,
  resultPath: ResultPath | undefined,
) => {
  const payload: AdapterBatchResponse = []
  const asset = response.data
  for (const rate of asset.rates) {
    const individualRequest = {
      ...request,
      data: {
        ...request.data,
        base: validator
          .overrideReverseLookup(AdapterName, 'overrides', asset.asset_id_base)
          .toUpperCase(),
        quote: validator
          .overrideReverseLookup(AdapterName, 'overrides', rate.asset_id_quote)
          .toUpperCase(),
      },
    }
    payload.push([
      CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),
      individualRequest,
      Requester.validateResultNumber(rate, resultPath),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<DefaultConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()
  const quote = validator.overrideSymbol(AdapterName, validator.validated.data.quote)
  const url = util.buildUrlPath('exchangerate/:symbol', { symbol })
  const params = {
    filter_asset_id: Array.isArray(quote) ? quote.join(',') : quote,
  }

  const options = {
    ...config.api,
    url,
    params: { ...config.api.params, ...params },
  }

  const response = await Requester.request<ResponseSchema>(options)

  if (Array.isArray(quote))
    return handleBatchedRequest(jobRunID, request, response, validator, ['rate'])

  const result = Requester.validateResultNumber(response.data, ['rates', 0, 'rate'])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
