import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

// Should also be supported for "EOD"
export const NAME = 'historical'
export const supportedEndpoints = ['historical', 'eod']

export interface ResponseSchema {
  meta_data: {
    api_name: string
    num_total_data_points: number
    credit_cost: number
    start_date: string
    end_date: string
  }
  result_data: {
    [ticker: string]: [
      {
        date: string
        volume: number
        high: number
        low: number
        adj_close: number
        close: number
        open: number
      },
    ]
  }
  cost: number
}

const customError = (data: ResponseSchema) =>
  !data.result_data || Object.keys(data.result_data).length === 0

export const description = `This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price).

**NOTE: each request sent to this endpoint has a cost of 10 credits**`

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin', 'market', 'symbol'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()

  const url = 'historical'
  const params = {
    tickers: symbol,
    accessKey: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['result_data', symbol, 0, 'close'])
  response.data.cost = 10

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
