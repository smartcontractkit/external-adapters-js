import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbol: string) => {
  const host = 'bravenewcoin-v1.p.rapidapi.com'
  const url = `https://${host}/convert`

  const headers = {
    'x-rapidapi-host': host,
    'x-rapidapi-key': util.getRequiredEnv('API_KEY'),
  }
  const params = {
    qty: 1,
    to: 'USD',
    from: symbol,
  }
  const config = {
    url,
    params,
    headers,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.payload[0] && data.payload[0].priceUSD
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index): Promise<Index> => {
  await Promise.all(
    index.map(async (i) => {
      const data = await getPriceData(i.asset)
      i.price = toAssetPrice(data)
    }),
  )
  return index
}

export default { getPriceIndex }
