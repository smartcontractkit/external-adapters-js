import { Requester, Validator, util } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  DefaultConfig,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['quotes', 'forex', 'price']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

export const description = `Returns a batched price comparison from a list currencies to a list of other currencies.

[\`/quotes\`](https://1forge.com/api#quotes) - Convert from one currency to another.

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`quotes\` endpoint instead.**`

export type TInputParameters = { base: string; quote: string }

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    description: ' The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  p: number
  a: number
  b: number
  s: string
  t: number
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema[]>,
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const pair of response.data) {
    const [base, quote] = pair['s'].split('/')
    payload.push([
      {
        ...request,
        data: { ...request.data, base: base.toUpperCase(), quote: quote.toUpperCase() },
      },
      Requester.validateResultNumber(pair, [resultPath]),
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
  const validator = new Validator<TInputParameters>(request, inputParameters)
  const jobRunID = validator.validated.id
  const url = `/quotes`
  const from = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const to = validator.validated.data.quote
  const pairArray = []

  for (const fromCurrency of util.formatArray(from)) {
    for (const toCurrency of util.formatArray(to)) {
      pairArray.push(`${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}`)
    }
  }
  const pairs = pairArray.toString()
  const params = {
    ...config.api?.params,
    pairs,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema[]>(options)
  if (Array.isArray(from) || Array.isArray(to))
    return handleBatchedRequest(jobRunID, request, response, 'a')

  const result = Requester.validateResultNumber(response.data[0], ['a'])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
