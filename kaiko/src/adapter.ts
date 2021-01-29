import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { DEFAULT_INTERVAL, DEFAULT_SORT, DEFAULT_MILLISECONDS, makeConfig } from './config'

const customError = (data: any) => data.result === 'error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const convertId: Record<string, string> = {
  uni: 'uniswap',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  let base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()

  // Correct common tickers that are misidentified
  base = convertId[base] || base

  let url = `/spot_exchange_rate/${base}/${quote}`
  if (quote === 'eth') {
    url = `/spot_direct_exchange_rate/${base}/${quote}`
  }

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
  const result = Requester.validateResultNumber(response.data.data, [0, 'price'])
  return Requester.success(jobRunID, {
    data: {
      ...response.data,
      result,
    },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
