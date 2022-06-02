import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  Config,
  AdapterRequest,
  InputParameters,
} from '@chainlink/ea-bootstrap'
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

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export type TInputParameters = {
  base: string
  quote: string
}

export const inputParameters: InputParameters<TInputParameters> = {
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
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const url = util.buildUrlPath('exchangerate/:symbol/:quote', { symbol, quote })

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['rate'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
