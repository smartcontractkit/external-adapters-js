import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const NAME = 'price'
export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  path: false,
}

const convertId: Record<string, string> = {
  FNX: 'FNX2',
  AMP: 'AMP2',
  WING: 'WING2',
  FTT: 'FTXTOKEN',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const convert = validator.validated.data.quote.toUpperCase()
  const jobRunID = validator.validated.id
  const path = validator.validated.data.path || Paths.Price

  const url = `/currencies/ticker`
  // Correct common tickers that are misidentified
  const ids = symbols
    .map((symbol) => convertId[symbol.toUpperCase()] || symbol.toUpperCase())
    .join(',')

  const params = {
    ids,
    convert,
    key: config.apiKey,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const resultPaths: { [key: string]: string[] } = {
    [Paths.Price]: ['price'],
    [Paths.MarketCap]: ['market_cap'],
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data[0], resultPaths[path])
  return Requester.success(jobRunID, response, config.verbose)
}
