import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'

export const supportedEndpoints = ['commodities']

export const endpointResultPaths = {
  commodities: 'price',
}

export interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
}

export const description = `https://finage.co.uk/docs/api/forex-last-trade
The result will be the price of the commodity in the currency specified`

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'symbol'],
    description: 'The symbol of the commodity to query',
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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(NAME, validator.validated.data.base).toUpperCase()
  const to = validator.overrideSymbol(NAME, validator.validated.data.quote).toUpperCase()
  const url = util.buildUrlPath('/last/trade/forex/:from:to', { from, to })
  const resultPath = validator.validated.data.resultPath

  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
