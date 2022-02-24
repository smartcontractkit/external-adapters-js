import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
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

  const symbolToIdOverride = validator.symbolToIdOverride?.[AdapterName.toLowerCase()]

  if (symbolToIdOverride) {
    if (Array.isArray(validator.validated.data.base)) {
      for (let i = 0; i < validator.validated.data.base.length; i++) {
        if (symbolToIdOverride[validator.validated.data.base[i]]) {
          validator.validated.data.base[i] = symbolToIdOverride[validator.validated.data.base[i]]
        }
      }
    } else if (symbolToIdOverride[validator.validated.data.base]) {
      validator.validated.data.base = symbolToIdOverride[validator.validated.data.base]
    }
  }

  // Will there every be 'duplicate overrides' where a specified id from symbolToIdOverride
  // is then overridden in overrideSymbol? Currently, this code assumes there are not.

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
