import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['etf']
export const batchablePropertyPath = [{ name: 'base' }]

export const description = `https://finage.co.uk/docs/api/etf-last-price
The result will be the price field in response.`

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the etf to query',
  },
}

export interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
}

export const makeEtfExecute =
  (executeConfig: { country?: string }): ExecuteWithConfig<Config> =>
  async (request, _, config) => {
    const validator = new Validator(request, inputParameters, {}, { overrides })

    const jobRunID = validator.validated.id
    const base = validator.validated.data.base
    const symbol = validator.overrideSymbol(NAME, base).toUpperCase()

    const url = util.buildUrlPath('/last/etf/:symbol', { symbol })

    const params = {
      apikey: config.apiKey,
    }

    const options = {
      ...config.api,
      url,
      params: executeConfig.country ? { ...params, country: executeConfig.country } : params,
    }

    const response = await Requester.request<ResponseSchema | ResponseSchema[]>(options)

    const result = Requester.validateResultNumber(response.data, ['price'])
    return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
  }

export const execute = makeEtfExecute({})
