import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  days: ['days', 'period', 'result', 'key'],
}

const daysConversion: Record<number, string> = {
  1: 'oneDayIv',
  2: 'twoDayIv',
  7: 'sevenDayIv',
  14: 'fourteenDayIv',
  21: 'twentyOneDayIv',
  28: 'twentyEightDayIv',
}

// TODO: Run tests with valid pro tier + API Key
export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/graphql'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const daysInput = validator.validated.data.days
  const days = daysConversion[daysInput] || daysInput

  const query =
    'query ChainlinkIv($symbol: SymbolEnumType){' +
    'ChainlinkIv(symbol: $symbol){' +
    'oneDayIv twoDayIv sevenDayIv fourteenDayIv twentyOneDayIv twentyEightDayIv' +
    '}' +
    '}'

  const data = {
    query: query,
    variables: { symbol },
  }

  const headers = {
    'x-oracle': config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    url,
    method: 'GET' as any,
    headers,
    data,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    'ChainlinkIv',
    0,
    days,
  ])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
