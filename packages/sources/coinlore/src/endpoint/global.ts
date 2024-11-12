import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  EndpointResultPaths,
} from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['global', 'globalmarketcap', 'dominance']

export const endpointResultPaths: EndpointResultPaths = {
  globalmarketcap: 'total_mcap',
  dominance: 'd',
  global: 'd',
}

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    description: 'When using a field of `d`, the currency to prefix the field with (e.g. `usd_d`',
    required: false,
    type: 'string',
    default: 'btc',
  },
}

interface ResponseSchema {
  coins_count: number
  active_markets: number
  total_mcap: number
  total_volume: number
  btc_d: string
  eth_d: string
  mcap_change: string
  volume_change: string
  avg_change_percent: string
  volume_ath: number
  mcap_ath: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const url = `global`
  const symbol = validator.validated.data.base || 'btc'
  let resultPath = (validator.validated.data.resultPath || '').toString()
  if (resultPath === 'd') resultPath = `${symbol.toLowerCase()}_d`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options)
  const result = Requester.validateResultNumber(response.data[0], [resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
