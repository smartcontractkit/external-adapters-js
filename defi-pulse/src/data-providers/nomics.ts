import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../priceAdapter'

const nomicsIds: Record<string, string> = {
  FTT: 'FTXTOKEN',
}

const getPriceData = async (symbols: string) => {
  const url = 'https://api.nomics.com/v1/currencies/ticker'
  const params = {
    ids: symbols,
    convert: 'USD',
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

const getPriceIndex: GetPriceIndex = async (index) => {
  const symbols: string[] = []
  index.forEach(({ asset }) => {
    let symbol = asset.toUpperCase()
    if (nomicsIds[symbol]) {
      symbol = nomicsIds[symbol]
    }
    symbols.push(symbol)
  })

  const prices = await getPriceData(symbols.join())

  const pricesMap = new Map()
  for (const p of prices) {
    pricesMap.set(p.symbol.toUpperCase(), p)
  }

  for (const i of index) {
    const data = pricesMap.get(i.asset.toUpperCase())
    i.price = toAssetPrice(data)
  }

  return index
}

export default { getPriceIndex }
