import { IncludePair, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'
import includes from '../config/includes.json'
import * as endpoints from './'

export const supportedEndpoints = ['live', 'commodities', 'stock']

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'symbol', 'market'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'convert'],
    required: false,
    description: 'The quote currency',
    type: 'string',
  },
}

export interface ResponseSchema {
  endpoint: string
  quotes: {
    ask: number
    base_currency: string
    bid: number
    mid: number
    quote_currency: string
  }[]
  requested_time: string
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters, {}, { includes, overrides })
  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  const { from, to, inverse } = validator.validated.data.quote
    ? util.getPairOptions<IncludePair, endpoints.TInputParameters>(
        NAME,
        validator,
        (_, i: IncludePair) => i,
        (from: string, to: string) => ({ from, to }),
      )
    : {
        from: validator.overrideSymbol(NAME, validator.validated.data.base),
        to: validator.validated.data.quote || '',
        inverse: false,
      }

  const currency = `${from.toUpperCase()}${to.toUpperCase()}`

  const params = {
    ...config.api?.params,
    currency,
  }

  const options = { ...config.api, params }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'], { inverse })
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
