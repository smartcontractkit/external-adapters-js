import { Requester, Validator, util } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['tickers', 'forex', 'price']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

export const description = `Convert a currency or currencies into another currency or currencies

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`tickers\` endpoint instead.**`

export type TInputParameters = { base: string | string[]; quote: string | string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to'],
    required: true,
    description: 'The symbol of the currency to query',
  },
}

export interface ResponseSchema {
  status: string
  tickers: Tickers[]
}

export interface Tickers {
  day: {
    c: number
    h: number
    l: number
    o: number
    v: number
  }
  lastQuote: {
    a: number
    b: number
    t: number
    x: number
  }
  min: {
    c: number
    h: number
    l: number
    o: number
    v: number
  }
  prevDay: {
    c: number
    h: number
    l: number
    o: number
    v: number
    vw: number
  }
  ticker: string
  todaysChange: number
  todaysChangePerc: number
  updated: number
}

interface keyPair {
  [key: string]: {
    base: string
    quote: string
  }
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string[],
) => {
  const payload: [AdapterRequest, number][] = []
  const pairDict: keyPair = {}
  const supportedTickers: string[] = []
  for (const b of request.data.base as string[]) {
    for (const q of request.data.quote as string[]) {
      pairDict[`C:${b}${q}`] = {
        base: String(b),
        quote: String(q),
      }
    }
  }

  for (const pair of response.data.tickers) {
    supportedTickers.push(pair.ticker)

    const base = pairDict[pair.ticker].base
    const quote = pairDict[pair.ticker].quote

    payload.push([
      {
        ...request,
        data: { ...request.data, base: base.toUpperCase(), quote: quote.toUpperCase() },
      },
      Requester.validateResultNumber(pair, resultPath),
    ])
  }

  for (const key in pairDict) {
    if (!supportedTickers.includes(key)) {
      console.log(`Currency pair not supported: ${JSON.stringify(pairDict[key])}`)
    }
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
  const url = `/v2/snapshot/locale/global/markets/forex/tickers`
  const from = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const to = validator.validated.data.quote
  const pairArray = []
  for (const fromCurrency of util.formatArray(from)) {
    for (const toCurrency of util.formatArray(to)) {
      pairArray.push(`C:${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}`)
    }
  }
  const pairs = pairArray.toString()
  const params = {
    ...config.api?.params,
    tickers: pairs,
  }
  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  if (Array.isArray(from) || Array.isArray(to))
    return handleBatchedRequest(jobRunID, request, response, ['min', 'c'])
  const result = Requester.validateResultNumber(response.data.tickers[0], ['min', 'c'])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
