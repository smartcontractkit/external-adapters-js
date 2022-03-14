import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['quote', 'price', 'stock']

const customError = (data: ResponseSchema[]) => data.length === 0

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['asset', 'from'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
}

const commonKeys: { [key: string]: string } = {
  N225: '^N225',
  FTSE: '^FTSE',
  AUD: 'AUDUSD',
  CHF: 'CHFUSD',
  EUR: 'EURUSD',
  GBP: 'GBPUSD',
  JPY: 'JPYUSD',
}

export interface ResponseSchema {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  change: number
  dayLow: number
  dayHigh: number
  yearHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  volume: number
  avgVolume: number
  exchange: string
  open: number
  previousClose: number
  eps: number
  pe: number
  earningsAnnouncement: number
  sharesOutstanding: number
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = util.buildUrlPath('/api/v3/quote/:symbol', { symbol }, '^')

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options, customError)
  const result = Requester.validateResultNumber(response.data, [0, 'price'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
