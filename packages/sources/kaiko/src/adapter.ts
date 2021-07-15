import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory, Includes } from '@chainlink/types'
import {
  DEFAULT_INTERVAL,
  DEFAULT_SORT,
  DEFAULT_MILLISECONDS,
  makeConfig,
  NAME as AdapterName,
} from './config'

const customError = (data: any) => data.result === 'error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  includes: false,
}

const symbolUrl = (from: string, to: string) =>
  to.toLowerCase() === 'eth'
    ? directUrl(from, to)
    : `/spot_exchange_rate/${from.toLowerCase()}/${to.toLowerCase()}`

const directUrl = (from: string, to: string) =>
  `/spot_direct_exchange_rate/${from.toLowerCase()}/${to.toLowerCase()}`

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error
  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  // provide a reasonable interval to fetch only recent results
  function calculateStartTime(millisecondsAgo: number) {
    const date = new Date()
    date.setTime(date.getTime() - millisecondsAgo)
    return date
  }

  const { url, inverse } = getOptions(validator)

  const params = {
    interval: DEFAULT_INTERVAL,
    sort: DEFAULT_SORT,
    start_time: calculateStartTime(DEFAULT_MILLISECONDS),
  }

  const requestConfig = {
    ...config.api,
    url,
    params,
    timeout: 10000,
  }
  const response = await Requester.request(requestConfig, customError)

  response.data.result = Requester.validateResultNumber(
    // sometimes, the most recent(fraction of a second) data contain null price
    response.data.data.filter((x: any) => x.price !== null),
    [0, 'price'],
    { inverse }
  )

  return Requester.success(jobRunID, response, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

const getOptions = (validator: Validator): {
  url: string
  inverse?: boolean
} => {
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const includes = validator.validated.data.includes || []

  const includeOptions = getIncludesOptions(validator, base, quote, includes)
  return includeOptions ?? {
    url: symbolUrl(base, quote)
  }
}

const getIncludesOptions = (validator: Validator, from: string, to: string, includes: string[] | Includes[]) => {
  const include = getIncludes(validator, from, to, includes)
  if (!include) return undefined
  return {
    url: directUrl(include.from, include.to),
    inverse: include.inverse
  }
}

const getIncludes = (validator: Validator, from: string, to: string, includes: string[] | Includes[]): Includes | undefined => {
  if (includes.length === 0) return undefined

  if (typeof includes[0] === 'string') {
    return {
      from,
      to: includes[0],
      inverse: false
    }
  }
  return validator.overrideIncludes(AdapterName, from, to, includes as Includes[])
}
