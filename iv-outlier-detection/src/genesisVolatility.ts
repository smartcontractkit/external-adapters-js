import { Requester } from '@chainlink/external-adapter'
import { ExternalFetch } from './adapter'

const convertDays: Record<number, string> = {
  1: 'oneDayIv',
  2: 'twoDayIv',
  7: 'sevenDayIv',
  14: 'fourteenDayIv',
  21: 'twentyOneDayIv',
  28: 'twentyEightDayIv',
}

export const fetchGenesisVolatility: ExternalFetch = async (
  symbol: string,
  days: number,
): Promise<number> => {
  const url = 'https://app.pinkswantrading.com/graphql'
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
    'x-oracle': process.env.API_KEY,
  }

  const config = {
    url,
    method: 'get',
    headers,
    data,
  }

  const response = await Requester.request(config)
  return Requester.validateResultNumber(response.data, [
    'data',
    'ChainlinkIv',
    0,
    convertDays[days],
  ])
}
