import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, Includes, IncludePair, InputParameters } from '@chainlink/types'
import {
  DEFAULT_INTERVAL,
  DEFAULT_SORT,
  DEFAULT_MILLISECONDS,
  NAME as AdapterName,
} from '../config'
import includes from '../config/includes.json'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['trades', 'price']

const customError = (data: ResponseSchema) => data.result === 'error'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The symbol of the currency to convert',
  },
  interval: {
    required: false,
    description:
      'The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly',
    default: '1m',
  },
  millisecondsAgo: {
    required: false,
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: 1800000,
  },
  sort: {
    required: false,
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
}

const symbolUrl = (from: string, to: string) =>
  to.toLowerCase() === 'eth'
    ? directUrl(from, to)
    : util.buildUrlPath('/spot_exchange_rate/:from/:to', {
        from: from.toLowerCase(),
        to: to.toLowerCase(),
      })

const directUrl = (from: string, to: string) =>
  util.buildUrlPath('/spot_direct_exchange_rate/:from/:to', {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
  })

export interface ResponseSchema {
  query: {
    page_size: number
    start_time: string
    interval: string
    sort: string
    base_asset: string
    sources: boolean
    ch: boolean
    include_exchanges: string[]
    exclude_exchanges: string[]
    quote_asset: string
    data_version: string
    commodity: string
    request_time: string
    instruments: string[]
    start_timestamp: number
  }
  time: string
  timestamp: number
  data: { timestamp: number; price: string }[]
  result: string
  access: {
    access_range: { start_timestamp: number; end_timestamp: number }
    data_range: { start_timestamp: number; end_timestamp: number }
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { includes, overrides })

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  // provide a reasonable interval to fetch only recent results
  function calculateStartTime(millisecondsAgo: number) {
    const date = new Date()
    date.setTime(date.getTime() - millisecondsAgo)
    return date
  }

  const { url, inverse } = getOptions(validator)

  const interval = validator.validated.data.interval || DEFAULT_INTERVAL
  const start_time = calculateStartTime(
    validator.validated.data.millisecondsAgo || DEFAULT_MILLISECONDS,
  )
  const sort = validator.validated.data.sort || DEFAULT_SORT

  const params = { interval, sort, start_time }

  const requestConfig = {
    ...config.api,
    url,
    params,
    timeout: 10000,
  }
  const response = await Requester.request<ResponseSchema>(requestConfig, customError)

  const data = response.data.data.filter((x) => x.price !== null)
  if (data.length == 0) {
    throw 'Unsupported Price Pair'
  }

  const result = Requester.validateResultNumber(
    // sometimes, the most recent(fraction of a second) data contain null price
    data,
    [0, 'price'],
    { inverse },
  )

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

const getOptions = (
  validator: Validator,
): {
  url: string
  inverse?: boolean
} => {
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const includes = validator.validated.includes || []

  const includeOptions = getIncludesOptions(validator, base, quote, includes)
  return (
    includeOptions ?? {
      url: symbolUrl(base, quote),
    }
  )
}

const getIncludesOptions = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
) => {
  const include = getIncludes(validator, from, to, includes)
  if (!include) return undefined
  return {
    url: directUrl(include.from, include.to),
    inverse: include.inverse,
  }
}

const getIncludes = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
): IncludePair | undefined => {
  if (includes.length === 0) return undefined

  const presetIncludes = validator.overrideIncludes(from, to)
  if (presetIncludes && typeof includes[0] === 'string') return presetIncludes
  else if (typeof includes[0] === 'string') {
    return {
      from,
      to: includes[0],
      inverse: false,
    }
  }
  return presetIncludes
}
