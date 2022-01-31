import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosResponse,
  AdapterRequest,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'crypto', 'stock', 'forex', 'commodities']
export const batchablePropertyPath = [{ name: 'base', limit: 120 }]

const customError = (data: { status: string }) => data.status !== 'OK'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin', 'market'],
    description: 'The symbol of the currency to query',
  },
}

const quoteEventSymbols: { [key: string]: boolean } = {
  'USO/USD:AFX': true,
}

export interface ResponseSchema {
  status: string
  Trade: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      time: number
      timeNanoPart: number
      sequence: number
      exchangeCode: string
      price: number
      change: number
      size: number
      dayVolume: number
      dayTurnover: number
      tickDirection: string
      extendedTradingHours: boolean
    }
  }
}
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(config.name || AdapterName)
  const symbol = Array.isArray(base)
    ? base.map((symbol) => symbol.toUpperCase()).join(',')
    : base.toUpperCase()

  const events = quoteEventSymbols[symbol] ? 'Quote' : 'Trade'
  const url = 'events.json'

  const params = {
    events,
    symbols: symbol,
  }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request<ResponseSchema>(options, customError)

  if (Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, request, response, events)
  }

  // NOTE: may need to force entries quoteEventSymbols to not use batching

  const quotePath = ['Quote', symbol, 'bidPrice']
  const tradePath = ['Trade', symbol, 'price']
  const result = Requester.validateResultNumber(
    response.data,
    events === 'Quote' ? quotePath : tradePath,
  )
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  events: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data[events]) {
    const isArray = Array.isArray(response.data[events][base])
    payload.push([
      {
        ...request,
        data: {
          ...request.data,
          base: response.data[events][base],
        },
      },
      Requester.validateResultNumber(
        response.data,
        isArray ? [events, base, 0, 'price'] : [events, base, 'price'],
      ),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}
