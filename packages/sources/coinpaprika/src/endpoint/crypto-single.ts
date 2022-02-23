import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, AdapterRequest, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolToId } from '../util'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['crypto-single']

const buildPath =
  (path: string) =>
  (request: AdapterRequest): string => {
    const validator = new Validator(request, inputParameters, {}, { overrides })

    const quote = validator.validated.data.quote
    return `quotes.${quote.toUpperCase()}.${path}`
  }

export const endpointResultPaths = {
  'crypto-single': buildPath('price'),
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    required: false,
    type: 'string',
  },
}
export interface ResponseSchema {
  id: string
  name: string
  symbol: string
  rank: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  beta_value: number
  first_data_at: string
  last_updated: string
  quotes: {
    [key: string]: {
      price: number
      volume_24h: number
      volume_24h_change_24h: number
      market_cap: number
      market_cap_change_24h: number
      percent_change_15m: number
      percent_change_30m: number
      percent_change_1h: number
      percent_change_6h: number
      percent_change_12h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      percent_change_1y: number
      ath_price: number
      ath_date: string
      percent_from_price_ath: number
    }
  }
  cost?: number
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    const coinIds = await getCoinIds(context, jobRunID)
    coin = getSymbolToId(symbol, coinIds)
  }

  const url = `v1/tickers/${coin.toLowerCase()}`
  const resultPath = validator.validated.data.resultPath

  const params = {
    quotes: quote.toUpperCase(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)
  response.data.cost = 2

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
