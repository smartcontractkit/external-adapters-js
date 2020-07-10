const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol', 'assetId', 'indexId', 'asset'],
  indexType: false,
  timestamp: false
}

const host = 'bravenewcoin.p.rapidapi.com'
const apiHeaders = {
  'x-rapidapi-host': host,
  'x-rapidapi-key': process.env.API_KEY
}

const authenticate = async () => {
  const response = await Requester.request({
    method: 'POST',
    url: `https://${host}/oauth/token`,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      useQueryString: true,
      ...apiHeaders
    },
    data: {
      audience: 'https://api.bravenewcoin.com',
      client_id: process.env.CLIENT_ID,
      grant_type: 'client_credentials'
    }
  })
  return response.data.access_token
}

const getAssetId = async (symbol) => {
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
  const jobRunID = validator.validated.id
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  _createRequest({
    jobRunID,
    url: `https://${host}/ohlcv`,
    symbol: validator.validated.data.symbol,
    indexType: 'GWA',
    timestamp: yesterday
  })
    .then(result => callback(result.status, result.data))
    .catch(error => callback(500, Requester.errored(jobRunID, error)))
}

const _createRequest = async (input) => {
  const token = await authenticate()
  const assetId = await getAssetId(input.symbol)
  return new Promise((resolve, reject) => {
    Requester.request({
      url: input.url,
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': process.env.API_KEY,
        authorization: `Bearer ${token}`,
        useQueryString: true
      },
      params: {
        indexId: assetId,
        indexType: input.indexType,
        timestamp: input.timestamp,
        size: 1
      }
    })
      .then(response => {
        response.data.result = Requester.validateResultNumber(response.data, ['content', 0, 'vwap'])
        resolve({
          status: response.status,
          data: Requester.success(input.jobRunID, response)
        })
      })
      .catch(error => reject(error))
  })
}

module.exports.createRequest = createRequest
