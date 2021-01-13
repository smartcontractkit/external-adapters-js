import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../config'

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

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  const symbols = index
    .map(({ asset }) => {
      const symbol = asset.toUpperCase()
      return nomicsIds[symbol] || symbol
    })
    .join()

  const prices = await getPriceData(symbols, currency)
  const pricesMap = new Map()
  for (const p of prices) {
    pricesMap.set(p.symbol.toUpperCase(), p)
  }

  return index.map((i) => {
    const data = pricesMap.get(i.asset.toUpperCase())
    return { ...i, price: toAssetPrice(data) }
  })
}

export default { getPriceIndex }
