import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'ticker']

export const endpointResultPaths = {
  crypto: 'bid',
  ticker: 'bid',
}

export const description =
  '**NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
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

export interface ResponseSchema {
  data: {
    ticker: {
      [key: string]: {
        date: string
        timestamp: number
        bid: number
        ask: number
        high: number
        low: number
        volume: number
      }
    }
    code: 'success'
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const url = util.buildUrlPath('ticker/:quote', { quote })
  const resultPath = validator.validated.data.resultPath

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['data', 'ticker', base, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
