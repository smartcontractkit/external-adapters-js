import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, AdapterRequest, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price']

export const endpointOverride = (request: AdapterRequest): string | null => {
  // The Assets endpoint supports batch requests, but only for USD quotes.
  // If possible, use it.
  const validator = new Validator(request, inputParameters)
  if (
    !Array.isArray(validator.validated.data.quote) &&
    validator.validated.data.quote?.toUpperCase() === 'USD'
  )
    return 'assets'
  return null
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
    description: 'The symbol of the currency to query [crypto](#Crypto-Endpoint)',
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

export interface ResponseSchema {
  time: string
  asset_id_base: string
  asset_id_quote: string
  rate: number
  src_side_base: {
    time: string
    asset: string
    rate: number
    volume: number
  }[]
  src_side_quote: {
    time: string
    asset: string
    rate: number
    volume: number
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const url = `exchangerate/${symbol}/${quote}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['rate'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
