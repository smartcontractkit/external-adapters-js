import { Requester } from '@chainlink/external-adapter'
import { ExternalFetch } from './adapter'

export const fetchDerbit: ExternalFetch = async (currency: string): Promise<number> => {
  const url = 'https://www.deribit.com/api/v2/public/get_historical_volatility'
  const params = { currency }
  const config = { url, params }

  const response = await Requester.request(config)
  const result: number[][] = response.data['result']
  const resultSorted = result.sort((a, b) => {
    if (a.length < 1 || b.length < 1) return 1
    if (a[0] < b[0]) return 1
    if (a[0] > b[0]) return -1
    return 0
  })

  if (resultSorted.length < 1 || resultSorted[0].length < 2) {
    throw new Error('no derbit value')
  }

  return resultSorted[0][1]
}
