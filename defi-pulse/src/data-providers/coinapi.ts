import { Requester } from '@chainlink/external-adapter'
import Decimal from 'decimal.js'
import { IndexAsset } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbol: string) => {
  const url = `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`
  const config = {
    url,
    params: {
      apikey: util.getRequiredEnv('API_KEY'),
    },
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (index: IndexAsset[]): number => {
  let value = new Decimal(0)
  index.forEach((i) => {
    const price = i.priceData && i.priceData.rate
    if (price <= 0) {
      throw Error('invalid price')
    }
    value = value.plus(new Decimal(i.units).times(new Decimal(price)))
  })
  return value.toNumber()
}

const getPriceIndex = async (index: IndexAsset[]): Promise<IndexAsset[]> => {
  await Promise.all(
    index.map(async (i) => {
      i.priceData = await getPriceData(i.asset)
    }),
  )
  return index
}

export default {
  calculateIndex,
  getPriceIndex,
}
