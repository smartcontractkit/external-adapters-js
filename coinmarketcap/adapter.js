const { Requester, Validator } = require('@chainlink/external-adapter')

const ENDPOINT_PRICE = 'price'
const ENDPOINT_DOMINANCE = 'dominance'
const ENDPOINT_MKTCAP = 'globalmarketcap'

const DEFAULT_ENDPOINT = ENDPOINT_PRICE

const customError = (data) => {
  if (Object.keys(data).length === 0) return true
  return false
}

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs = {
  COMP: 'compound',
  BNT: 'bancor',
  RCN: 'ripio-credit-network',
  UNI: 'uniswap',
  CRV: 'curve-dao-token',
  FNX: 'finnexus',
  ETC: 'ethereum-classic',
  BAT: 'basic-attention-token',
}

// TODO: fix validation. CMC should support at least one "id" or "slug" or "symbol" for this request.
const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
  slug: false,
}

const price = (jobRunID, input, callback) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const validator = new Validator(input, priceParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const symbol = validator.validated.data.symbol
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert

  const params = { convert }
  if (cid) {
    params.id = cid
  } else if (slug) {
    params.slug = slug
  } else {
    const slugForSymbol = presetSlugs[symbol]
    if (slugForSymbol) {
      params.slug = slugForSymbol
    } else {
      params.symbol = symbol
    }
  }

  const config = {
    url,
    headers: {
      'X-CMC_PRO_API_KEY': process.env.API_KEY,
    },
    params,
  }

  // CMC API currently uses ID as key in response, when querying with "slug" param
  const _keyForSlug = (data, slug) => {
    if (!data || !data.data) return
    // First try to find slug key in response (in case the API starts returning keys correctly)
    if (Object.keys(data.data).includes(slug)) return slug
    // Fallback to ID
    const o = Object.values(data.data).find((o) => o.slug === slug)
    return o && o.id
  }

  Requester.request(config)
    .then((response) => {
      const key = params.id || _keyForSlug(response.data, params.slug) || params.symbol
      const path = ['data', key, 'quote', convert, 'price']
      response.data.result = Requester.validateResultNumber(response.data, path)
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

const globalParams = {
  market: ['market', 'to', 'quote'],
}

const dominance = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const headers = {
    'X-CMC_PRO_API_KEY': process.env.API_KEY,
  }

  const config = {
    url,
    headers,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, ['data', dataKey])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config, customError).then(_handleResponse).catch(_handleError)
}

const marketcap = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const convert = validator.validated.data.market.toUpperCase()
  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const params = { convert }
  const headers = {
    'X-CMC_PRO_API_KEY': process.env.API_KEY,
  }

  const config = {
    url,
    params,
    headers,
  }

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, [
      'data',
      'quote',
      convert,
      'total_market_cap',
    ])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config, customError).then(_handleResponse).catch(_handleError)
}

const customParams = {
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_PRICE:
      return price(jobRunID, input, callback)
    case ENDPOINT_DOMINANCE:
      return dominance(jobRunID, input, callback)
    case ENDPOINT_MKTCAP:
      return marketcap(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
