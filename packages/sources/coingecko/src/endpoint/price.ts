import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, AxiosResponse, AdapterRequest } from '@chainlink/types'
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

const buildPath = (path: string | Paths, quote: string): string => {
  if (path === Paths.MarketCap) return `${quote.toLowerCase()}_market_cap`
  if (path === Paths.Price) return `${quote.toLowerCase()}`
  throw new Error('Invalid path')
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse,
  path: string,
  idToSymbol: Record<string, string>,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data) {
    for (const quote in response.data[base]) {
      const symbol = idToSymbol?.[base]
      if (symbol)
        payload.push([
          {
            ...request,
            data: { ...request.data, base: symbol.toUpperCase(), quote: quote.toUpperCase() },
          },
          Requester.validateResultNumber(response.data, [
            base,
            buildPath(path, quote.toLowerCase()),
          ]),
        ])
    }
  }
  response.data.results = payload
  return Requester.success(jobRunID, response, true, ['base', 'quote'])
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  let idToSymbol = {}
  let ids = coinid
  if (!ids) {
    try {
      const coinIds = await getCoinIds(jobRunID)
      const symbols = Array.isArray(base) ? base : [base]
      idToSymbol = getSymbolsToIds(symbols, coinIds)
      ids = Object.keys(idToSymbol).join(',')
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = '/simple/price'
  const path = (validator.validated.data.path as string) || Paths.Price

  const params = {
    ids,
    vs_currencies: Array.isArray(quote) ? quote.join(',') : quote,
    include_market_cap: path === Paths.MarketCap,
    x_cg_pro_api_key: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)

  if (Array.isArray(base) || Array.isArray(quote))
    return handleBatchedRequest(jobRunID, request, response, path, idToSymbol)

  response.data.result = Requester.validateResultNumber(response.data, [
    ids.toLowerCase(),
    buildPath(path, quote.toLowerCase()),
  ])

  return Requester.success(jobRunID, response, config.verbose, ['base', 'quote'])
}
