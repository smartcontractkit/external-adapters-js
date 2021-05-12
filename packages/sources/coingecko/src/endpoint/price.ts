import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, AxiosResponse } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolsToIds } from '../util'

export const NAME = 'price'

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
}

const handleBatchedRequest = (
  jobRunID: string,
  response: AxiosResponse,
  path: string,
  param: { [key: string]: string },
  quote: string,
  idToSymbol: Record<string, string>,
) => {
  const payload: Record<string, number> = {}
  for (const key in response.data) {
    const symbol = idToSymbol?.[key]
    if (symbol)
      payload[symbol] = Requester.validateResultNumber(response.data, [
        key,
        param[path] || quote.toLowerCase(),
      ])
  }
  response.data.results = payload
  return Requester.success(jobRunID, response, true)
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  let idToSymbol = {}
  let ids = coinid
  if (!ids) {
    try {
      const coinIds = await getCoinIds(jobRunID)
      const symbols = Array.isArray(symbol) ? symbol : [symbol]
      idToSymbol = getSymbolsToIds(symbols, coinIds)
      ids = Object.keys(idToSymbol).join(',')
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = '/simple/price'
  const path: string = validator.validated.data.path || Paths.Price

  const params = {
    ids,
    vs_currencies: quote,
    include_market_cap: path === Paths.MarketCap,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const param: { [key: string]: string } = {
    [Paths.MarketCap]: `${quote.toLowerCase()}_market_cap`,
    [Paths.Price]: `${quote.toLowerCase()}`,
  }

  const response = await Requester.request(options, customError)

  if (Array.isArray(symbol))
    return handleBatchedRequest(jobRunID, response, path, param, quote, idToSymbol)

  response.data.result = Requester.validateResultNumber(response.data, [
    ids.toLowerCase(),
    param[path] || quote.toLowerCase(),
  ])
  return Requester.success(jobRunID, response, config.verbose)
}
