import {
  Requester,
  Validator,
  CacheKey,
  util,
  IncludePair,
  PairOptionsMap,
} from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
  AdapterBatchResponse,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import includes from '../config/includes.json'

export const supportedEndpoints = ['forex', 'price']
export const batchablePropertyPath = [{ name: 'quote' }]

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.**'

export type TInputParameters = { base: string; quote: string | string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

export type TOptions = {
  base: string
  quote: string
  inverse?: boolean
}

export interface ResponseSchema {
  disclaimer: string
  license: string
  timestamp: number
  base: string
  rates: {
    [key: string]: number
  }
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  pairOptions: PairOptionsMap<TOptions>,
  responses: { [base: string]: AxiosResponse<ResponseSchema> },
) => {
  const payload: AdapterBatchResponse = []

  for (const base of Object.keys(pairOptions)) {
    for (const quote of Object.keys(pairOptions[base])) {
      const individualRequest = {
        ...request,
        data: {
          ...request.data,
          base: base.toUpperCase(),
          quote: quote.toUpperCase(),
        },
      }

      const pairOption = pairOptions[base][quote]

      const result = Requester.validateResultNumber(
        responses[pairOption.base].data,
        ['rates', pairOption.quote],
        { inverse: pairOption.inverse },
      )

      payload.push([
        CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),
        individualRequest,
        result,
      ])
    }
  }

  return Requester.success(
    jobRunID,
    { data: { payload, results: payload } },
    true,
    batchablePropertyPath,
  )
}

const getIncludesOptions = (
  //@ts-expect-error validator is unused var
  validator: Validator<TInputParameters>,
  include: IncludePair,
): TOptions | undefined => ({
  base: include.from,
  quote: include.to,
  inverse: include.inverse,
})

const defaultGetOptions = (base: string, quote: string): TOptions => ({ base, quote })

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { includes })

  const jobRunID = validator.validated.id
  const url = 'latest.json'

  const pairOptions = util.getPairOptions<TOptions, TInputParameters>(
    AdapterName,
    validator,
    getIncludesOptions,
    defaultGetOptions,
  )

  const requestIsBatched = typeof pairOptions.base !== 'string'

  const responses: { [base: string]: AxiosResponse<ResponseSchema> } = {}

  const requestBases = requestIsBatched
    ? Object.values(pairOptions as PairOptionsMap<TOptions>).reduce(
        (bases: string[], quoteOptions): string[] => {
          for (const includesOptions of Object.values(quoteOptions)) {
            if (!bases.includes(includesOptions.base)) bases.push(includesOptions.base)
          }
          return bases
        },
        [],
      )
    : [pairOptions.base]

  for (const base of requestBases) {
    const options = {
      ...config.api,
      params: {
        base,
        app_id: config.apiKey,
      },
      url,
    }

    responses[base as string] = await Requester.request<ResponseSchema>(options)
  }

  if (requestIsBatched)
    return handleBatchedRequest(
      jobRunID,
      request,
      pairOptions as PairOptionsMap<TOptions>,
      responses,
    )

  const response = responses[pairOptions.base as string]
  const result = Requester.validateResultNumber(
    response.data,
    ['rates', pairOptions.quote as string],
    { inverse: pairOptions.inverse as boolean },
  )

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
