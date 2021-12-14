import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { authenticate, apiHeaders, getAssetId, host } from '../helpers'

export const supportedEndpoints = ['vwap']

export const inputParameters: InputParameters = {
  symbol: {
    aliases: ['base', 'from', 'coin', 'symbol', 'assetId', 'indexId', 'asset'],
    description: ' Retrieve all the OHLCV values for a particular asset or market',
    options: ['BTC', 'ETH', 'USD'],
    required: true,
  },
  indexType: {
    aliases: ['to', 'market'],
    description: 'Restrict the OHLCV results to the index type.',
    options: ['MWA', 'GWA'],
    default: 'GWA',
  },
  timestamp: {
    // TODO: currently unused, deprecate or utilize me
    description:
      'Retrieve all daily OHLCV records from the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
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
  response.data.result = Requester.validateResultNumber(response.data, ['content', 0, 'vwap'])

  return Requester.success(jobRunID, response, config.verbose)
}
