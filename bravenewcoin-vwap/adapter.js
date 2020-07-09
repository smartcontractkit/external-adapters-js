const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol', 'assetId', 'indexId', 'asset'],
  indexType: false,
  timestamp: false
}

const host = 'bravenewcoin.p.rapidapi.com'

const authenticate = async () => {
  const response = await Requester.request({
    method: 'POST',
    url: `https://${host}/oauth/token`,
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-host': host,
      'x-rapidapi-key': process.env.API_KEY,
      accept: 'application/json',
      useQueryString: true
    },
    data: {
      audience: 'https://api.bravenewcoin.com',
      client_id: process.env.CLIENT_ID,
      grant_type: 'client_credentials'
    }
  })
  return response.data.access_token
}

const getAssetId = async (token, symbol) => {
  const response = await Requester.request({
    url: `https://${host}/asset`,
    headers: {
      'content-type': 'application/octet-stream',
      'x-rapidapi-host': host,
      'x-rapidapi-key': process.env.API_KEY,
      useQueryString: true
    },
    params: {
      status: 'ACTIVE',
      symbol
    }
  })
  return response.data.content[0].id
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const url = `https://${host}/ohlcv`
  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const indexType = validator.validated.data.indexType || 'GWA'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const timestamp = validator.validated.data.timestamp || yesterday

  const auth = authenticate()
  const id = auth.then(token => {
    return getAssetId(token, symbol)
  })
  return Promise.all([auth, id]).then(([token, assetId]) => {
    const params = {
      indexId: assetId,
      indexType,
      timestamp,
      size: 1
    }
    const config = {
      url,
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': process.env.API_KEY,
        authorization: `Bearer ${token}`,
        useQueryString: true
      },
      params
    }
    Requester.request(config)
      .then(response => {
        response.data.result = Requester.validateResultNumber(response.data, ['content', 0, 'vwap'])
        callback(response.status, Requester.success(jobRunID, response))
      })
      .catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  }).catch(error => {
    callback(500, Requester.errored(jobRunID, error))
  })
}

module.exports.createRequest = createRequest
