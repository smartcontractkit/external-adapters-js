import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

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

const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://app.pinkswantrading.com/graphql'
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
    method: 'GET',
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

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
