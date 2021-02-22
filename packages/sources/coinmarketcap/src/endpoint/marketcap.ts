import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'
import { getSymbolData } from './price'

export const NAME = 'marketcap'

const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  quote: ['quote', 'to', 'market', 'convert'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const assets = Array.isArray(symbol) ? symbol : [symbol]
  const quote = validator.validated.data.quote

  const _validateMarketCap = (data: any) =>
    Requester.validateResultNumber(data, ['quote', quote, 'market_cap'])

  const response = await getSymbolData(config, { assets }, quote)
  const result =
    Object.values(response.assets).length === 1 &&
    _validateMarketCap(Object.values(response.assets)[0])

  const payloadEntries = Object.entries(response.assets).map(([symbol, price]) => {
    const val = {
      quote: {
        [quote]: { marketCap: _validateMarketCap(price) },
      },
    }
    return [symbol, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
