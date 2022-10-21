import { AxiosRequestConfig, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { authenticate, apiHeaders, getAssetId, host } from '../helpers'

export const supportedEndpoints = ['vwap']

export const description =
  "[BraveNewCoin's 24 Hour USD VWAP](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_8b8774ba-b368-4399-9c4a-dc78f13fc786)"

export type TInputParameters = { symbol: string; indexType: string; timestamp: string }
export const inputParameters: InputParameters<TInputParameters> = {
  symbol: {
    aliases: ['base', 'from', 'coin', 'assetId', 'indexId', 'asset'],
    description: ' Retrieve the VWAP for a particular asset or market',
    required: true,
    type: 'string',
  },
  indexType: {
    description: 'Restrict the OHLCV results to the index type.',
    options: ['MWA', 'GWA'],
    type: 'string',
  },
  timestamp: {
    description:
      'Retrieve the daily OHLCV record from before the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ',
  },
}

export interface ResponseSchema {
  content: {
    close: number
    endTimestamp: string
    high: number
    id: string
    indexId: string
    indexType: string
    low: number
    open: number
    startTimestamp: string
    timestamp: string
    twap: number
    volume: number
    vwap: number
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const timestamp = validator.validated.data.timestamp
  const symbol = validator.validated.data.symbol
  const indexType = validator.validated.data.indexType

  const url = `https://${host}/ohlcv`
  const token = await authenticate()
  const assetId = await getAssetId(symbol)

  const options: AxiosRequestConfig = {
    url,
    headers: {
      ...apiHeaders,
      authorization: `Bearer ${token}`,
    },
    params: {
      indexId: assetId,
      indexType,
      timestamp,
      size: 1,
    },
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['content', 0, 'vwap'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
