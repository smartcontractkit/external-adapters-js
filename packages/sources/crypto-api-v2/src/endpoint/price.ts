import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const Name = 'price'

interface ResponseSchema {
  "apiVersion": string,
  "requestId": string,
  "data": {
    "item": {
        "calculationTimestamp": number,
        "fromAssetId": string,
        "fromAssetSymbol": string,
        "rate": number,
        "toAssetId": string,
        "toAssetSymbol": string
    }
  },
}

const priceParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/v2/market-data/exchange-rates/by-symbols/${coin}/${market}`
  const reqConfig = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, [
    'data',
    'item',
    'rate'
  ])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
