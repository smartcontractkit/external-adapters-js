import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  Config,
  IncludePair,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import includes from './../config/includes.json'

export const supportedEndpoints = ['volume']

const customError = (data: ResponseSchema) => {
  return Object.keys(data.payload).length === 0
}

const today = new Date()
const yesterday = new Date(today)

const symbolOptions = (from: string, to: string) => ({
  url: util.buildUrlPath('/api/v2/market/spot/prices/pairs/:from_:to/historical', {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
  }),
  params: {
    timeInterval: 'd',
    startDate: yesterday.setDate(yesterday.getDate() - 1),
    endDate: today.valueOf(),
    includeCrossRates: true,
  },
})

const tokenOptions = (from: string, to: string) => ({
  url: util.buildUrlPath('/api/v2/market/defi/prices/pairs/bases/:from/quotes/:to/historical', {
    from,
    to,
  }),
  params: {
    timeInterval: 'd',
    startDate: yesterday.setDate(yesterday.getDate() - 1),
    endDate: today.valueOf(),
  },
})

const getIncludesOptions = (
  validator: Validator<TInputParameters>,
  include: IncludePair,
): TOptions | undefined => {
  if (include?.tokens) {
    const fromAddress = validator.overrideToken(include.from)
    const toAddress = validator.overrideToken(include.to)

    if (!fromAddress || !toAddress) return undefined
    return {
      ...tokenOptions(fromAddress, toAddress),
      inverse: include.inverse,
    }
  }

  return {
    ...symbolOptions(include?.from, include?.to),
    inverse: include?.inverse,
  }
}

const customOverrideIncludes = (base: string, _: string, includes: string[]) => ({
  from: base,
  to: includes[0],
  inverse: false,
  tokens: true,
})

export const description =
  'Gets the [24h-volume for historical of a pair](https://docs.amberdata.io/reference#spot-price-pair-historical) from Amberdata.'

export type TInputParameters = { base: string; quote: string }

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
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

export type TOptions = {
  url: string
  params: Record<string, unknown>
  inverse?: boolean
}

export interface ResponseSchema {
  status: number
  title: string
  description: string
  payload: {
    metadata: { startDate: number; endDate: number }
    data: {
      timestamp: number
      pair: string
      price: string
      volume: string
    }[]
  }
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters, {}, { includes })

  const jobRunID = validator.validated.id
  const { url, params, inverse } = util.getPairOptions<TOptions, TInputParameters>(
    AdapterName,
    validator,
    getIncludesOptions,
    symbolOptions,
    customOverrideIncludes,
  )
  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data, ['payload', 'data', 0, 'volume'], {
    inverse,
  })
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
