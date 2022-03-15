import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'tickers']

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

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

interface ResponseSchema {
  data: {
    id: string
    type: string
    attributes: {
      last: number
      open: number
      high: number
      low: number
      vwap: number
      volume: number
      bid: number
      ask: number
      price_before_last: number
    }
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const quote = validator.validated.data.quote
  const resultPath = validator.validated.data.resultPath || 'vwap'
  const url = util.buildUrlPath(`tickers/:base_:quote`, { base, quote })

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['data', 'attributes', resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
