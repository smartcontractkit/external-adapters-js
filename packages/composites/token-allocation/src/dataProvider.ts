import { Requester } from '@chainlink/ea-bootstrap'
import { PriceAdapter, ResponsePayload } from './types'
import { AdapterImplementation, RequestConfig } from '@chainlink/types'
// data provider external adapters
import Amberdata from '@chainlink/amberdata-adapter'
import CoinApi from '@chainlink/coinapi-adapter'
import CoinGecko from '@chainlink/coingecko-adapter'
import CoinMarketCap from '@chainlink/coinmarketcap-adapter'
import CoinPaprika from '@chainlink/coinpaprika-adapter'
import CryptoCompare from '@chainlink/cryptocompare-adapter'
import Kaiko from '@chainlink/kaiko-adapter'
import Nomics from '@chainlink/nomics-adapter'

export const adapters: AdapterImplementation[] = [
  Amberdata,
  CoinApi,
  CoinGecko,
  CoinMarketCap,
  CoinPaprika,
  CryptoCompare,
  Kaiko,
  Nomics,
]

export type Source = typeof adapters[number]['NAME']

export const getPriceProvider = (apiConfig: RequestConfig, jobRunID: string) => async (
  symbols: string[],
  quote: string,
  withMarketCap = false,
): Promise<ResponsePayload> => {
  const results = await Promise.all(
    symbols.map(async (base) => {
      const data = {
        id: jobRunID,
        data: { base, quote, endpoint: withMarketCap ? 'marketcap' : 'price' },
      }
      const response = await Requester.request({ ...apiConfig, data: data })
      return response.data.result
    }),
  )
  const payloadEntries = symbols.map((symbol, i) => {
    const key = symbol
    const val = {
      quote: {
        [quote]: { [withMarketCap ? 'marketCap' : 'price']: results[i] },
      },
    }
    return [key, val]
  })

  return Object.fromEntries(payloadEntries)
}
