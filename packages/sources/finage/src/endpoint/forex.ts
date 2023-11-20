import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export function invertPair(base: string, quote: string) {
  if (
    quote.toUpperCase() == 'USD' &&
    !['EUR', 'GBP', 'NZD', 'XAG', 'XAU', 'XPT', 'XPD', 'XCU'].includes(base.toUpperCase())
  ) {
    return [quote.toUpperCase(), base.toUpperCase(), true]
  }
  return [base.toUpperCase(), quote.toUpperCase(), false]
}

export const supportedEndpoints = ['forex']

export const description = `https://finage.co.uk/docs/api/forex-last-quote
The result will be calculated as the midpoint between the ask and the bid.`

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
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

  const [from, to, inverse] = invertPair(
    validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase(),
    validator.validated.data.quote.toUpperCase(),
  )

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
  const ask = Requester.validateResultNumber(response.data, ['ask'], { inverse: Boolean(inverse) })
  const bid = Requester.validateResultNumber(response.data, ['bid'], { inverse: Boolean(inverse) })

  const result = (ask + bid) / 2
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
