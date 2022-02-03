import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['globalmarketcap']

export const inputParameters: InputParameters = {}

export interface ResponseSchema {
  num_currencies: string
  num_currencies_active: string
  num_currencies_inactive: string
  num_currencies_dead: string
  num_currencies_new: string
  market_cap: string
  transparent_market_cap: string
  '1d': PriceChange
  '7d': PriceChange
  '30d': PriceChange
  '365d': PriceChange
  ytd: PriceChange
}

export interface PriceChange {
  market_cap_change: string
  market_cap_change_pct: string
  transparent_market_cap_change: string
  transparent_market_cap_change_pct: string
  volume: string
  volume_change: string
  volume_change_pct: string
  spot_volume: string
  spot_volume_change: string
  spot_volume_change_pct: string
  derivative_volume: string
  derivative_volume_change: string
  derivative_volume_change_pct: string
  transparent_volume: string
  transparent_volume_change: string
  transparent_volume_change_pct: string
  transparent_spot_volume: string
  transparent_spot_volume_change: string
  transparent_spot_volume_change_pct: string
  transparent_derivative_volume: string
  transparent_derivative_volume_change: string
  transparent_derivative_volume_change_pct: string
  volume_transparency: {
    grade: string
    volume: string
    volume_change: string
    volume_change_pct: string
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, {}, {}, { overrides })

  const jobRunID = validator.validated.id
  const url = `/global-ticker`

  const params = {
    key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['market_cap'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
