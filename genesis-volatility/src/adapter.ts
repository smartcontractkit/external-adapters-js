import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig } from './config'

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  days: ['days', 'period'],
}

export const execute: Execute = async (input, config: Config) => {
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
    'x-oracle': config.apikey,
  }

  const response = await Requester.request({
    url,
    method: 'get',
    headers,
    data,
  })
  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    'ChainlinkIv',
    0,
    days,
  ])
  return Requester.success(jobRunID, response)
}

// Export function to integrate with Chainlink node
export const executeWithDefaults: Execute = async (request) => execute(request, getConfig())
