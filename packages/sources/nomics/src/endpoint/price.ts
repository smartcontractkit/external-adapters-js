import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config, ResponsePayload } from '@chainlink/types'

export const PRICE_NAME = 'price'
export const MARKET_CAP_NAME = 'marketcap'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  endpoint: false,
}

const convertId: Record<string, string> = {
  FNX: 'FNX2',
  AMP: 'AMP2',
  WING: 'WING2',
  FTT: 'FTXTOKEN',
}

const getPayload = (data: any, symbols: string[], quote: string, marketCap: boolean) => {
  const pricesMap = new Map()
  for (const p of data) {
    pricesMap.set(p.symbol.toUpperCase(), p)
  }

  const payloadEntries = symbols.map((symbol) => {
    const key = symbol.toUpperCase()
    const data = pricesMap.get(symbol.toUpperCase())
    const val = {
      quote: {
        [quote.toUpperCase()]: {
          price: Requester.validateResultNumber(data, ['price']),
          ...(marketCap && { marketCap: Requester.validateResultNumber(data, ['market_cap']) }),
        },
      },
    }
    return [key, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return payload
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const convert = validator.validated.data.quote.toUpperCase()
  const jobRunID = validator.validated.id
  const withMarketCap = validator.validated.data.endpoint === MARKET_CAP_NAME

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
  const result = symbols.length === 1 && Requester.validateResultNumber(response.data[0], ['price'])
  const payload = getPayload(response.data, symbols, convert, withMarketCap)
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
