import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const nomicsIds: Record<string, string> = {
  FTT: 'FTXTOKEN',
}

const getPriceData = async (symbols: string, currency: string) => {
  const url = 'https://api.nomics.com/v1/currencies/ticker'
  const params = {
    ids: symbols,
    convert: currency.toUpperCase(),
    key: util.getRequiredEnv('API_KEY'),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.price
  if (!price || price <= 0) {
    throw new Error('Invalid price')
  }
  return price
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const symbols = baseSymbols
    .map((symbol) => nomicsIds[symbol.toUpperCase()] || symbol.toUpperCase())
    .join()

  const prices = await getPriceData(symbols, quote)
  const pricesMap = new Map()
  for (const p of prices) {
    pricesMap.set(p.symbol.toUpperCase(), p)
  }

  const entries = baseSymbols.map((symbol) => {
    const data = pricesMap.get(symbol.toUpperCase())
    return [symbol, toAssetPrice(data)]
  })

  return Object.fromEntries(entries)
}
