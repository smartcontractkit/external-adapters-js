import {
  Requester,
  Validator,
  CacheKey,
  ResultPath,
  AdapterBatchResponse,
} from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  DefaultConfig,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['assets']
export const batchablePropertyPath = [{ name: 'base' }]

export const endpointResultPaths = {
  assets: 'price_usd',
}

export interface ResponseSchema {
  asset_id: string
  name: string
  type_is_crypto: number
  data_start: string
  data_end: string
  data_quote_start: string
  data_quote_end: string
  data_orderbook_start: string
  data_orderbook_end: string
  data_trade_start: string
  data_trade_end: string
  data_symbols_count: number
  volume_1hrs_usd: number
  volume_1day_usd: number
  volume_1mth_usd: number
  price_usd: number
  id_icon: string
}

export type TInputParameters = {
  base: string | string[]
}

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to convert to ',
    required: true,
  },
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema[]>,
  validator: Validator<TInputParameters>,
  resultPath: ResultPath | undefined,
) => {
  const payload: AdapterBatchResponse = []

  for (const asset of response.data) {
    const individualRequest = {
      ...request,
      data: {
        ...request.data,
        base: validator
          .overrideReverseLookup(AdapterName, 'overrides', asset.asset_id)
          .toUpperCase(),
      },
    }
    payload.push([
      CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),
      individualRequest,
      Requester.validateResultNumber(asset, resultPath),
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
  const resultPath = validator.validated.data.resultPath
  const from = validator.validated.data.base
  const symbol = validator.overrideSymbol(AdapterName, from)
  const url = `assets`
  const params = {
    filter_asset_id: Array.isArray(symbol) ? symbol.join(',') : symbol,
  }

  const options = {
    ...config.api,
    url,
    params: { ...config.api.params, ...params },
  }

  const response = await Requester.request<ResponseSchema[]>(options)

  if (Array.isArray(symbol))
    return handleBatchedRequest(jobRunID, request, response, validator, resultPath)

  const result = Requester.validateResultNumber(response.data[0], resultPath)
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
