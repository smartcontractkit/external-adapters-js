import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  days: ['days', 'period'],
}

const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://app.pinkswantrading.com/graphql'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const days = validator.validated.data.days

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

export const makeExecute: ExecuteFactory = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
