import { Requester, logger } from '@chainlink/external-adapter'
import { DominanceData } from './index'
import { util } from '@chainlink/ea-bootstrap'

const getDominanceData = async (symbols: string) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const params = {
    symbol: symbols,
  }
  const config = {
    url,
    params,
    headers: {
      'X-CMC_PRO_API_KEY': util.getRequiredEnv('API_KEY'),
    },
  }

  const response = await Requester.request(config)
  return response.data
}

const getDominance = async (currencies: string[]): Promise<DominanceData[]> => {
  const { data } = await getDominanceData(currencies.join())
  const dominance = currencies.map((currency) => {
    const dominance = Requester.validateResultNumber(data, [currency, 'quote', 'USD', 'market_cap'])
    return { currency, dominance }
  })
  logger.debug(dominance)
  return dominance
}

export default { getDominance }
