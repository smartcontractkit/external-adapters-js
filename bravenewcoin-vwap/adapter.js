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
      useQueryString: true,
      ...apiHeaders
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

  const _onResponse = (resp) => {
    const path = ['content', 0, 'vwap']
    resp.data.result = Requester.validateResultNumber(resp.data, path)
    callback(resp.status, Requester.success(jobRunID, resp))
  }

  const _onError = (error) =>
    callback(500, Requester.errored(jobRunID, error))

  _createRequest({
    url: `https://${host}/ohlcv`,
    symbol: validator.validated.data.symbol,
    indexType: 'GWA',
    timestamp: yesterday
  }).then(_onResponse)
    .catch(_onError)
}

const _createRequest = async (input) => {
  const token = await authenticate()
  const assetId = await getAssetId(input.symbol)
  return await Requester.request({
    url: input.url,
    headers: {
      ...apiHeaders,
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
}

module.exports.createRequest = createRequest
