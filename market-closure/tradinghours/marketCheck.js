const { Requester } = require('external-adapter')

const commonMICs = {
  FTSE: 'xlon',
  N225: 'xjpx'
}

const tradingHalted = (exchange, callback) => {
  exchange = commonMICs[exchange]
  if (exchange.length === 0) {
    return callback(false)
  }

  Requester.requestRetry({
    url: 'https://www.tradinghours.com/api/v2/status',
    qs: {
      market: exchange,
      api_token: process.env.TH_API_KEY
    }
  })
    .then(response => {
      callback(Requester.getResult(response.body, [exchange, 'status']).toLowerCase() !== 'open')
    })
    .catch(() => {
      callback(false)
    })
}

exports.tradingHalted = tradingHalted
