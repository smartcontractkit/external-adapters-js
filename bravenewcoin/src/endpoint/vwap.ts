import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { authenticate, apiHeaders, getAssetId, host } from '../helpers'

export const NAME = 'vwap'

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol', 'assetId', 'indexId', 'asset'],
  indexType: false,
  timestamp: false, // TODO: currently unused, deprecate or utilize me
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const symbol = validator.validated.data.symbol

  const url = `https://${host}/ohlcv`
  const indexType = 'GWA'
  const token = await authenticate()
  const assetId = await getAssetId(symbol)

  const options = {
    url,
    headers: {
      ...apiHeaders,
      authorization: `Bearer ${token}`,
      useQueryString: true,
    },
    params: {
      indexId: assetId,
      indexType: indexType,
      timestamp: yesterday,
      size: 1,
    },
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['content', 0, 'vwap'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
