import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
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

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const base = (validator.overrideSymbol(AdapterName) as string).toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const includes = validator.validated.data.includes || []

  let inverse = false
  let url = `/spot_exchange_rate/${base}/${quote}`
  if (includes.length > 0 && base === 'digg' && includes[0].toLowerCase() === 'wbtc') {
    inverse = true
    url = `/spot_direct_exchange_rate/wbtc/digg`
  } else if (includes.length > 0 && base === 'rgt' && includes[0].toLowerCase() === 'weth') {
    inverse = true
    url = `/spot_direct_exchange_rate/weth/rgt`
  } else if (includes.length > 0 && base === 'rari' && includes[0].toLowerCase() === 'weth') {
    inverse = true
    url = `/spot_direct_exchange_rate/weth/rari`
  } else if (includes.length > 0 && includes[0].toLowerCase() === 'weth') {
    url = `/spot_direct_exchange_rate/${base}/weth`
  } else if (quote === 'eth') {
    url = `/spot_direct_exchange_rate/${base}/${quote}`
  }

  // provide a reasonable interval to fetch only recent results
  function calculateStartTime(millisecondsAgo: number) {
    const date = new Date()
    date.setTime(date.getTime() - millisecondsAgo)
    return date
  }

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
  let result = Requester.validateResultNumber(
    // sometimes, the most recent(fraction of a second) data contain null price
    response.data.data.filter((x: any) => x.price !== null),
    [0, 'price'],
  )
  if (inverse && result != 0) {
    result = 1 / result
  }
  response.data.result = result

  return Requester.success(jobRunID, response, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
