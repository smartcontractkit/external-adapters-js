import { util } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'price'

const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const symbol = validator.validated.data.symbol
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert

  let params
  if (symbol.length > 0) {
    params = {
      symbol,
      convert,
    }
  } else {
    params = {
      id: cid,
      convert,
    }
  }

  const options = {
    ...config.api,
    url,
    headers: {
      'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
    },
    params,
  }
  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [
    'data',
    symbol,
    'quote',
    convert,
    'price',
  ])
  console.log('result:', result)
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
