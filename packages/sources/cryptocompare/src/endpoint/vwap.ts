import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['vwap', 'crypto-vwap']

interface ConversionType {
  type: string
  conversionSymbol: string
}

export interface ResponseSchema {
  ConversionType: ConversionType
  [quoteSymbol: string]: number | ConversionType // ConversionType is needed as an option here, because types
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `/data/dayAvg`
  let symbol = validator.overrideSymbol(AdapterName)
  if (Array.isArray(symbol)) symbol = symbol[0]
  const quote = validator.validated.data.quote

  const subMs = validator.validated.data.hours * 60 * 60 * 1000
  const toDate = new Date(new Date().getTime() - subMs)
  toDate.setUTCHours(0, 0, 0, 0)

  const params = {
    fsym: symbol.toUpperCase(),
    tsym: quote.toUpperCase(),
    toTs: Math.ceil(toDate.getTime() / 1000),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)

  const result = Requester.validateResultNumber(response.data, [quote.toUpperCase()])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
