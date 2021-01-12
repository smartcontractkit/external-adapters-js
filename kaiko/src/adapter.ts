import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { util } from '@chainlink/ea-bootstrap'

const customError = (data: any) => {
  if (data.result === 'error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const convertId: { [key: string]: string } = {
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
  if (base in convertId) {
    base = convertId[base]
  }

  let url = 'https://us.market-api.kaiko.io'
  if (quote === 'eth') {
    url += `/v2/data/trades.v1/spot_direct_exchange_rate/${base}/${quote}`
  } else {
    url += `/v2/data/trades.v1/spot_exchange_rate/${base}/${quote}`
  }

  const start_time = new Date() // eslint-disable-line camelcase
  start_time.setTime(start_time.getTime() - 1000000)
  const params = {
    interval: '1m',
    sort: 'desc',
    start_time,
  }
  const headers = {
    'X-Api-Key': util.getRandomRequiredEnv('API_KEY'),
    'User-Agent': 'Chainlink',
  }
  const requestConfig = {
    url,
    params,
    headers,
    timeout: 10000,
  }

  try {
    const response = await Requester.request(requestConfig, customError)
    const result = (response.data.result = Number(
      Requester.validateResultNumber(response.data.data, [0, 'price']),
    ))
    response.data.result = result
    return Requester.success(jobRunID, {
      data: response.data,
      result,
      status: 200,
    })
  } catch (err) {
    return Requester.errored(jobRunID, err.message)
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
