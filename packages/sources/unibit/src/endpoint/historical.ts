import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

// Should also be supported for "EOD"
export const NAME = 'historical'
export const supportedEndpoints = ['historical']

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
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'market', 'symbol'],
    required: true,
    description: 'The symbol of the currency to query',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()

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

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data.result_data, [
    symbol,
    0,
    'close',
  ])
  response.data.cost = 10

  return Requester.success(jobRunID, response, config.verbose)
}
