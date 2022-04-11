import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['forex']

export const description = `https://finage.co.uk/docs/api/forex-last-quote
The result will be calculated as the midpoint between the ask and the bid.`

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
}

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const url = util.buildUrlPath('/last/forex/:from:to', { from, to })
  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const ask = Requester.validateResultNumber(response.data, ['ask'])
  const bid = Requester.validateResultNumber(response.data, ['bid'])
  const result = (ask + bid) / 2
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
