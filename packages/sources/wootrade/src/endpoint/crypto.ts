import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
export interface ResponseSchema {
  success: boolean
  rows: MarketTrades[]
}
export interface MarketTrades {
  symbol: string
  side: string
  executed_price: number
  executed_quantity: number
  executed_timestamp: string
}

export const supportedEndpoints = ['crypto', 'ticker']

const customError = (data: ResponseSchema) => data?.rows?.length === 0

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  if (Array.isArray(base)) base = base[0]
  const quote = validator.validated.data.quote
  const symbol = `SPOT_${base.toUpperCase()}_${quote.toUpperCase()}`
  const limit = '1'
  const url = `/v1/public/market_trades/`

  const params = {
    symbol,
    limit,
  }

  const options = { ...config.api, params, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['rows', 0, 'executed_price'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
