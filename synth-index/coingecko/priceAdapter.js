const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getCoinList = async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list'
  const config = {
    url
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceData = async (id) => {
  const url = 'https://api.coingecko.com/api/v3/simple/price'
  const params = {
    ids: id,
    vs_currencies: 'usd'
  }
  const config = {
    url,
    params
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach(i => {
      const price = i.priceData[i.coinId].usd
      if (price <= 0) {
        throw Error('invalid price')
      }
      value = value.plus(new Decimal(i.units).times(new Decimal(price)))
    })
  } catch (error) {
    throw error.message
  }
  return value.toNumber()
}

const createRequest = async (jobRunID, data) => {
  const coinList = await getCoinList()
  await Promise.all(data.index.map(async (synth) => {
    const coin = coinList.find(d => d.symbol.toLowerCase() === synth.symbol.toLowerCase() && d.name !== 'LEOcoin')
    synth.coinId = coin.id
    synth.priceData = await getPriceData(coin.id)
  }))
  return data
}

module.exports.createRequest = createRequest
module.exports.calculateIndex = calculateIndex
