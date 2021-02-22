import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

export const PRICE_NAME = 'multi'
export const MARKET_CAP_NAME = 'multimarketcap'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

const getPayload = (data: any, symbols: string[], quote: string, marketCap: boolean) => {
  // There are duplicate symbols on the response. We only want the lowest in rank
  const sortedData = data.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  const payloadEntries = symbols.map((symbol) => {
    const key = symbol
    const data = priceMap.get(symbol.toUpperCase())
    const val = {
      quote: {
        [quote.toUpperCase()]: {
          price: Requester.validateResultNumber(data, ['quotes', quote.toUpperCase(), 'price']),
          ...(marketCap && {
            marketCap: Requester.validateResultNumber(data, [
              'quotes',
              quote.toUpperCase(),
              'market_cap',
            ]),
          }),
        },
      },
    }
    return [key, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return payload
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/v1/tickers`
  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const quote = validator.validated.data.quote
  const withMarketCap = validator.validated.data.endpoint === MARKET_CAP_NAME

  const params = {
    quotes: quote.toUpperCase(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)

  const payload = getPayload(response.data, symbols, quote, withMarketCap)

  const result = ''
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
