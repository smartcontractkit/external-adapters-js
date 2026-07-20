import nock from 'nock'
import { marketStatusGraphqlQuery } from '../../src/transport/market-status'

const allMarketData = [
  {
    referenceData: {
      marketBase: {
        bc: 4,
        tradingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        marketOpenTime: '08:30:00',
        marketCloseTime: '17:40:00',
        marketTimeZone: 'Europe/Zurich',
      },
      marketHolidays: [],
    },
  },
  {
    referenceData: {
      marketBase: {
        bc: 2,
        tradingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        marketOpenTime: '08:30:00',
        marketCloseTime: '17:40:00',
        marketTimeZone: 'Europe/Zurich',
      },
      marketHolidays: [
        {
          date: '2001-01-01',
          extraordinaryTradingDay: false,
          extraordinaryOpeningTime: null,
          extraordinaryClosingTime: null,
        },
      ],
    },
  },
]

const getMarketData = (ids: string[]) => {
  const idSet = new Set(ids)
  return allMarketData.filter((market) => idSet.has(market.referenceData.marketBase.bc.toString()))
}

export const mockOneMarket = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['4'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: getMarketData(['4']),
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockTwoMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['2', '4'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: getMarketData(['2', '4']),
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

export const mockThreeMarkets = (): nock.Scope =>
  nock('https://api.six-group.com')
    .post('/web/v2/graphql', {
      query: marketStatusGraphqlQuery,
      variables: {
        ids: ['2', '4', '5'],
      },
    })
    .reply(
      200,
      {
        data: {
          markets: getMarketData(['2', '4', '5']),
        },
      },
      ['Content-Type', 'application/json'],
    )
    .persist()
