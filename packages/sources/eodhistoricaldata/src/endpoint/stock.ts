import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['price', 'stock']

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['asset', 'from', 'symbol'],
    type: 'string',
    description:
      'The symbol of the currency to query taken from [here](https://eodhistoricaldata.com/financial-apis/category/data-feeds/)',
  },
}

const commonKeys: { [key: string]: string } = {
  N225: 'N225.INDX',
  FTSE: 'FTSE.INDX',
  BZ: 'BZ.COMM',
}

export interface ResponseSchema {
  code: string
  timestamp: number
  gmtoffset: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  previousClose: number
  change: number
  change_p: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = util.buildUrlPath('/api/real-time/:symbol', { symbol })

  const params = {
    ...config.api.params,
    fmt: 'json',
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['close'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
