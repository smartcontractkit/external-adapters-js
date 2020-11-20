import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import Decimal from 'decimal.js'
import { GetPriceIndex, CalculateIndex } from '../priceAdapter'

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

const calculateIndex: CalculateIndex = (indexes) => {
  let value = new Decimal(0)
  console.log(indexes)
  indexes.forEach((i) => {
    const price = i.priceData && i.priceData.price
    if (!price || price <= 0) {
      throw Error('invalid price')
    }
    value = value.plus(new Decimal(i.units).times(new Decimal(price)))
  })

  return value.toNumber()
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
    i.priceData = pricesMap.get(i.asset.toUpperCase())
  }

  return index
}

export default {
  calculateIndex,
  getPriceIndex,
}
