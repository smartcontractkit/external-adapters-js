import { Requester } from '@chainlink/external-adapter'
import { getConfig } from './config'
const CMC_ENDPOINT = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`

export const getMarketCaps = async (cryptoCurrencies: Array<string>): Promise<Array<number>> => {
  const params = {
    symbol: cryptoCurrencies.join(','),
  }

  const config = {
    url: CMC_ENDPOINT,
    headers: {
      'X-CMC_PRO_API_KEY': getConfig().cmcApiKey,
    },
    params,
  }

  const response = await Requester.request(config)
  const path = (symbol: string) => ['data', symbol, 'quote', 'USD', 'market_cap']
  const result = cryptoCurrencies.map((symbol: string) => {
    return Requester.validateResultNumber(response.data, path(symbol))
  })

  return result
}
