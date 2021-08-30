import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['price']
export interface ResponseSchema {
  apiVersion: string
  requestId: string
  data: {
    item: {
      calculationTimestamp: number
      fromAssetId: string
      fromAssetSymbol: string
      rate: number
      toAssetId: string
      toAssetSymbol: string
    }
  }
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/v2/market-data/exchange-rates/by-symbols/${coin}/${market}`
  const reqConfig = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['data', 'item', 'rate'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
