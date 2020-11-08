const { Requester } = require('@chainlink/external-adapter')
const { CMC_API_KEY } = require('./config')
const CMC_ENDPOINT = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`

const getMarketCaps = async (cryptoCurrencies) => {
  const params = {
    symbol: cryptoCurrencies.join(','),
  }
  const config = {
    url: CMC_ENDPOINT,
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
    },
    params,
  }

  const response = await Requester.request(config)
  const path = (symbol) => ['data', symbol, 'quote', 'USD', 'market_cap']
  const result = cryptoCurrencies.map((symbol) => {
    return Requester.validateResultNumber(response.data, path(symbol))
  })

  return result
}

module.exports = {
  getMarketCaps,
}
