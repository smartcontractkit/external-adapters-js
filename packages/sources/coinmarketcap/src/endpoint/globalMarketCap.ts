import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['globalmarketcap']

export const description = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

export const inputParameters: InputParameters = {
  market: {
    aliases: ['quote', 'to'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
}
export interface ResponseSchema {
  data: {
    active_cryptocurrencies: number
    total_cryptocurrencies: number
    active_market_pairs: number
    active_exchanges: number
    total_exchanges: number
    eth_dominance: number
    btc_dominance: number
    eth_dominance_yesterday: number
    btc_dominance_yesterday: number
    eth_dominance_24h_percentage_change: number
    btc_dominance_24h_percentage_change: number
    defi_volume_24h: number
    defi_volume_24h_reported: number
    defi_market_cap: number
    defi_24h_percentage_change: number
    stablecoin_volume_24h: number
    stablecoin_volume_24h_reported: number
    stablecoin_market_cap: number
    stablecoin_24h_percentage_change: number
    derivatives_volume_24h: number
    derivatives_volume_24h_reported: number
    derivatives_24h_percentage_change: number
    quote: {
      [key: string]: {
        total_market_cap: number
        total_volume_24h: number
        total_volume_24h_reported: number
        altcoin_volume_24h: number
        altcoin_volume_24h_reported: number
        altcoin_market_cap: number
        defi_volume_24h: number
        defi_volume_24h_reported: number
        defi_24h_percentage_change: number
        defi_market_cap: number
        stablecoin_volume_24h: number
        stablecoin_volume_24h_reported: number
        stablecoin_24h_percentage_change: number
        stablecoin_market_cap: number
        derivatives_volume_24h: number
        derivatives_volume_24h_reported: number
        derivatives_24h_percentage_change: number
        last_updated: string
        total_market_cap_yesterday: number
        total_volume_24h_yesterday: number
        total_market_cap_yesterday_percentage_change: number
        total_volume_24h_yesterday_percentage_change: number
      }
    }
    last_updated: string
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id

  const convert = validator.validated.data.market.toUpperCase()
  const url = '/global-metrics/quotes/latest'

  const params = { convert }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [
    'data',
    'quote',
    convert,
    'total_market_cap',
  ])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
