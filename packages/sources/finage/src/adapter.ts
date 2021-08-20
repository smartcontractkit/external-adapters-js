import {
  ExecuteWithConfig,
  ExecuteFactory,
  Config,
  AxiosResponse,
  AdapterRequest,
  MakeWSHandler,
} from '@chainlink/types'
import { Requester, Validator, AdapterError, util } from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'

const customParams = {
  base: ['base', 'from', 'symbol'],
  endpoint: false,
}

interface ResponseScheme {
  symbol: string
  ask: number
  bid: number
  asize: number
  bsize: number
  timestamp: number
}

const DEFAULT_ENDPOINT = 'stock'

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  let url: string
  const base = validator.validated.data.base
  const symbol = Array.isArray(base)
    ? base.map((symbol) => symbol.toUpperCase()).join(',')
    : (validator.overrideSymbol(NAME) as string).toUpperCase()

  const apikey = util.getRandomRequiredEnv('API_KEY')
  let responsePath
  let params

  switch (endpoint) {
    case 'stock': {
      url = getStockURL(base, symbol)
      responsePath = ['bid']
      params = {
        apikey,
      }
      break
    }
    case 'eod': {
      url = `/agg/stock/prev-close/${symbol}`
      responsePath = ['results', 0, 'c']
      params = {
        apikey,
      }
      break
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  if (Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, response)
  }

  response.data.result = Requester.validateResultNumber(response.data, responsePath)
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const getStockURL = (base: string | string[], symbol: string) => {
  if (Array.isArray(base)) {
    return `/last/stocks/?symbols=${symbol}`
  }
  return `/last/stock/${symbol}`
}

const handleBatchedRequest = (jobRunID: string, response: AxiosResponse<ResponseScheme>) => {
  const payload: { symbol: string; bid: number }[] = []
  for (const base in response.data) {
    payload.push({
      symbol: response.data[base].symbol,
      bid: response.data[base].bid,
    })
    Requester.validateResultNumber(response.data, [base, 'bid'])
  }
  response.data.result = payload
  return Requester.success(jobRunID, response)
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (symbols?: string, subscribe = true) => {
    if (!symbols) return
    const sub = {
      action: subscribe ? 'subscribe' : 'unsubscribe',
      symbols,
    }
    return sub
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    return validator.validated.data.base.toUpperCase()
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (!message.s) return undefined
        return getSubscription(`${message.s.toUpperCase()}`)
      },
      isError: (message: any) => message['status_code'] && message['status_code'] !== 200,
      filter: (message: any) => !!message.p,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['p'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
