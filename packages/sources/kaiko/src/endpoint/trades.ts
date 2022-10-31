import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  IncludePair,
  InputParameters,
} from '@chainlink/ea-bootstrap'
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

export type TInputParameters = {
  base: string
  quote: string
  interval: string
  millisecondsAgo: number
  sort: string
}

export const inputParameters: InputParameters<TInputParameters> = {
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
    default: '2m',
  },
  millisecondsAgo: {
    required: false,
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: 86_400_000, // 24 hours
  },
  sort: {
    required: false,
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
}

export type TOptions = {
  url: string
  inverse?: boolean
}

const getUrl = (from: string, to: string) => ({
  url: util.buildUrlPath('/spot_exchange_rate/:from/:to', {
    from: from.toLowerCase(),
    to: to.toLowerCase(),
  }),
})

const getIncludesOptions = (_: Validator<TInputParameters>, include: IncludePair) => {
  return {
    ...getUrl(include.from, include.to),
    inverse: include.inverse,
  }
}

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

  const { url, inverse } = util.getPairOptions<TOptions, TInputParameters>(
    AdapterName,
    validator,
    getIncludesOptions,
    getUrl,
  )

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
    throw 'Kaiko is not returning any price data for this price pair, likely due to too low trading volume for the requested interval. This is not an issue with the external adapter.'
  }

  const result = Requester.validateResultNumber(
    // sometimes, the most recent(fraction of a second) data contain null price
    data,
    [0, 'price'],
    { inverse },
  )

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
