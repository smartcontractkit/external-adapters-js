import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['eod-close', 'eod']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol to query',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  avgTotalVolume: number
  calculationPrice: string
  change: number
  changePercent: number
  close: number
  closeSource: string
  closeTime: number
  companyName: string
  currency: string
  delayedPrice: number
  delayedPriceTime: number
  extendedChange: number
  extendedChangePercent: number
  extendedPrice: number
  extendedPriceTime: number
  high: number
  highSource: string
  highTime: number
  iexAskPrice: number
  iexAskSize: number
  iexBidPrice: number
  iexBidSize: number
  iexClose: number
  iexCloseTime: number
  iexLastUpdated: number
  iexMarketPercent: number
  iexOpen: number
  iexOpenTime: number
  iexRealtimePrice: number
  iexRealtimeSize: number
  iexVolume: number
  lastTradeTime: number
  latestPrice: number
  latestSource: string
  latestTime: string
  latestUpdate: number
  latestVolume: number
  low: number
  lowSource: string
  lowTime: number
  marketCap: number
  oddLotDelayedPrice: number
  oddLotDelayedPriceTime: number
  open: number
  openTime: number
  openSource: string
  peRatio: number
  previousClose: number
  previousVolume: number
  primaryExchange: string
  symbol: string
  volume: number
  week52High: number
  week52Low: number
  ytdChange: number
  isUSMarketOpen: boolean
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const url = util.buildUrlPath('stock/:base/quote', { base: base.toUpperCase() })

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['close'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
