import { 
  ExecuteWithConfig, 
  ExecuteFactory,
  Config, 
  AxiosResponse 
} from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'

const customParams = {
  base: ['base', 'from', 'symbol'],
  endpoint: false,
}

interface ResponseScheme {
  symbol:string,
  ask: number,
  bid: number,
  asize: number,
  bsize: number,
  timestamp: number,
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
  if(Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, response)
  }
  
  response.data.result = Requester.validateResultNumber(response.data, responsePath)
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const getStockURL = (base: string | string[], symbol: string) => {
  if(Array.isArray(base)) {
    return `/last/stocks/?symbols=${symbol}`
  }
  return `/last/stock/${symbol}`
}

const handleBatchedRequest = (
  jobRunID: string,
  response: AxiosResponse<ResponseScheme>,
) => {
  const payload: {symbol: string, bid: number}[] = []
  for(const base in response.data) {
    payload.push({
      symbol: response.data[base].symbol,
      bid: response.data[base].bid
    })
    Requester.validateResultNumber(response.data, [base, 'bid'])
  }
  response.data.result = payload
  return Requester.success(jobRunID, response)
}

