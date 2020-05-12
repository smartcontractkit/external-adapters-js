const { Requester } = require('@chainlink/external-adapter')

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

    Requester.requestRetry({
      url: 'https://www.tradinghours.com/api/v2/status',
      qs: {
        market: exchange,
        api_token: process.env.TH_API_KEY
      }
    })
      .then(response => {
        if (!(exchange in response.body)) {
          return reject(Error('missing exchange in body'))
        }

        resolve(Requester.getResult(response.body, [exchange, 'status']).toLowerCase() !== 'open')
      })
      .catch(reject)
  })
}

exports.tradingHalted = tradingHalted
