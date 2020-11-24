import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
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

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.rate
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}
const getPriceIndex = async (index: Index): Promise<Index> => {
  await Promise.all(
    index.map(async (i) => {
      const data = await getPriceData(i.asset)
      const price = toAssetPrice(data)
      i.price = price
    }),
  )
  return index
}

export default { getPriceIndex }
