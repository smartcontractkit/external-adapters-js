import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['forex', 'price']
export const batchablePropertyPath = [{ name: 'quote' }]

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.**'

export type TInputParameters = { base: string; quote: string }
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
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  symbols: string[],
) => {
  const payload: [AdapterRequest, number][] = []
  for (const symbol of symbols) {
    const from = response.data.base
    payload.push([
      {
        ...request,
        data: { ...request.data, base: from.toUpperCase(), quote: symbol.toUpperCase() },
      },
      Requester.validateResultNumber(response.data, [resultPath, symbol]),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = 'latest.json'
  const base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const to = validator.validated.data.quote

  const params = {
    base,
    app_id: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)

  if (Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'rates', to)

  const result = Requester.validateResultNumber(response.data, ['rates', to])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
