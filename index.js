const adapterCreateRequest = require('./adapter').createRequest
const marketStatusRequest = require('./market-status').marketStatusRequest

const createRequest = (input, callback) => {
  if ((process.env.CHECK_MARKET_STATUS || '').toLowerCase() !== 'true') {
    adapterCreateRequest(input, callback)
  } else {
    marketStatusRequest(input, callback, adapterCreateRequest)
  }
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}
