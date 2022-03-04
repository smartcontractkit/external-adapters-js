import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import overrides from '../config/symbolToIdOverrides.json'

export const supportedEndpoints = ['globalmarketcap', 'dominance']

export const endpointResultPaths = {
  globalmarketcap: 'total_market_cap',
  dominance: 'market_cap_percentage',
}

const customError = (data: ResponseSchema) => {
  return Object.keys(data).length === 0
}

export const description =
  'Query the global market cap from [Coingecko](https://api.coingecko.com/api/v3/global)'

export const inputParameters: InputParameters = {
  market: {
    aliases: ['quote', 'to', 'coin'],
    description:
      'The ticker of the coin to query. [Supported tickers](https://api.coingecko.com/api/v3/global)',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  data: {
    active_cryptocurrencies: number
    upcoming_icos: number
    ongoing_icos: number
    ended_icos: number
    markets: number
    total_market_cap: Record<string, number>
    total_volume: Record<string, number>
    market_cap_percentage: Record<string, number>
    market_cap_change_percentage_24h_usd: number
    updated_at: number
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const market = validator.validated.data.market.toLowerCase()
  const resultPath = validator.validated.data.resultPath

  const url = '/global'

  const options = {
    ...config.api,
    url,
    params: {
      x_cg_pro_api_key: config.apiKey,
    },
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['data', resultPath, market])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
