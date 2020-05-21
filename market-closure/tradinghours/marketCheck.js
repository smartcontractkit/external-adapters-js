const { Requester, AdapterError } = require('@chainlink/external-adapter')

const commonMICs = {
  FTSE: 'xlon',
  N225: 'xjpx'
}

const tradingHalted = (exchange) => {
  return new Promise((resolve, reject) => {
    exchange = commonMICs[exchange]
    if (exchange.length === 0) {
      return resolve(false)
    }

    Requester.request({
      url: 'https://www.tradinghours.com/api/v2/status',
      params: {
        market: exchange,
        api_token: process.env.TH_API_KEY
      }
    })
      .then(response => {
        if (!(exchange in response.data)) {
          return reject(new AdapterError('Missing exchange in body'))
        }

        resolve(Requester.getResult(response.data, [exchange, 'status']).toLowerCase() !== 'open')
      })
      .catch(reject)
  })
}

exports.tradingHalted = tradingHalted
