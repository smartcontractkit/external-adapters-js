import { Requester, logger } from '@chainlink/external-adapter'
import { DominanceData } from './index'

const getDominanceData = async () => {
  const url = 'https://api.coingecko.com/api/v3/global'
  const params = {}
  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  return response.data
}

const getDominance = async (currencies: string[]): Promise<DominanceData[]> => {
  const { data } = await getDominanceData()

  const dominance = currencies.map((currency) => {
    const dominance = Requester.validateResultNumber(data, [
      'market_cap_percentage',
      currency.toLowerCase(),
    ])

    return { currency, dominance }
  })
  logger.debug(dominance)
  return dominance
}

export default { getDominance }
