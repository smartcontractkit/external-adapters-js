import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
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

export const description =
  'https://developers.cryptoapis.io/technical-documentation/market-data/exchange-rates/get-exchange-rate-by-asset-symbols'

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
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = util.buildUrlPath('/v2/market-data/exchange-rates/by-symbols/:coin/:market', {
    coin,
    market,
  })
  const reqConfig = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['data', 'item', 'rate'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
