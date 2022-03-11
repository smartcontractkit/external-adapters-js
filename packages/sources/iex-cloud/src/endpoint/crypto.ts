import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol to convert to',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  symbol: string
  primaryExchange: string
  sector: string
  calculationPrice: string
  high: string
  low: string
  latestPrice: string
  latestSource: string
  latestUpdate: number
  latestVolume: string
  previousClose: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const url = util.buildUrlPath(`crypto/:base:quote/quote`, {
    base: base.toUpperCase(),
    quote: quote.toUpperCase(),
  })

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['latestPrice'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
