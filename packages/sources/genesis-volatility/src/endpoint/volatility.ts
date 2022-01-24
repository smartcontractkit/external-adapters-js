import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['volatility']

export const inputParameters: InputParameters = {
  symbol: {
    required: true,
    aliases: ['base', 'from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  days: {
    required: true,
    aliases: ['period', 'result', 'key'],
    description: 'The key to get the result from',
    type: 'number',
  },
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
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

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
