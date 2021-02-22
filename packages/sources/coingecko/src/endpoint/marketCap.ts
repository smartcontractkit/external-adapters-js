import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'
import { getCoinList, getIdtoSymbol, getPriceData } from './price'
export const NAME = 'marketcap'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const getPayload = (symbols: string[], marketCaps: any, quote: string) => {
  const payloadEntries = symbols.map((symbol) => {
    const key = symbol
    const val = {
      quote: {
        [quote.toUpperCase()]: {
          marketCap: marketCaps[symbol],
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
  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const coingeckoSymbolId = validator.validated.data.coinid
  const quote = validator.validated.data.quote

  const coinList = await getCoinList(config)
  const idToSymbol = getIdtoSymbol(symbols, coinList)
  const ids = coingeckoSymbolId
    ? coingeckoSymbolId.toLowerCase()
    : Object.keys(idToSymbol).join(',')

  const response: Record<string, any> = await getPriceData(config, ids, quote, true)
  const marketCaps = Object.fromEntries(
    Object.entries(response).map(([coinId, data]) => [
      idToSymbol[coinId],
      Requester.validateResultNumber(data, [`${quote.toLowerCase()}_market_cap`]),
    ]),
  )

  const result = symbols.length === 1 && marketCaps[symbols[0]]
  const payload = getPayload(symbols, marketCaps, quote)
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
