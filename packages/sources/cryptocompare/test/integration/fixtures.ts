import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
export const mockCryptoSuccess = (): nock.Scope =>
  nock('https://min-api.cryptocompare.com', {
    encodedQueryParams: true,
  })
    .get('/data/pricemultifull')
    .query({ fsyms: 'ETH', tsyms: 'USD' })
    .reply(
      200,
      {
        RAW: {
          ETH: {
            USD: {
              TYPE: '5',
              MARKET: 'CCCAGG',
              FROMSYMBOL: 'ETH',
              TOSYMBOL: 'USD',
              FLAGS: '2052',
              PRICE: 1276.75,
              LASTUPDATE: 1666357726,
              MEDIAN: 1276.59,
              LASTVOLUME: 0.6333,
              LASTVOLUMETO: 808.876092,
              LASTTRADEID: '34667055',
              VOLUMEDAY: 287782.6125126447,
              VOLUMEDAYTO: 367505833.00910026,
              VOLUME24HOUR: 573086.14879595,
              VOLUME24HOURTO: 735584356.0525743,
              OPENDAY: 1282.68,
              HIGHDAY: 1292.33,
              LOWDAY: 1254.6,
              OPEN24HOUR: 1298.03,
              HIGH24HOUR: 1311.05,
              LOW24HOUR: 1253.35,
              LASTMARKET: 'binanceusa',
              VOLUMEHOUR: 22103.92288265006,
              VOLUMEHOURTO: 28158189.562133063,
              OPENHOUR: 1269.67,
              HIGHHOUR: 1277.56,
              LOWHOUR: 1268.24,
              TOPTIERVOLUME24HOUR: 573086.14879595,
              TOPTIERVOLUME24HOURTO: 735584356.0525743,
              CHANGE24HOUR: -21.279999999999973,
              CHANGEPCT24HOUR: -1.6394074096900666,
              CHANGEDAY: -5.930000000000064,
              CHANGEPCTDAY: -0.4623132815667246,
              CHANGEHOUR: 7.079999999999927,
              CHANGEPCTHOUR: 0.5576252097001525,
              CONVERSIONTYPE: 'direct',
              CONVERSIONSYMBOL: '',
              SUPPLY: 122373863.499,
              MKTCAP: 156240830222.34824,
              MKTCAPPENALTY: 0,
              CIRCULATINGSUPPLY: 122373863.499,
              CIRCULATINGSUPPLYMKTCAP: 156240830222.34824,
              TOTALVOLUME24H: 2594280.295149976,
              TOTALVOLUME24HTO: 3316143982.4100766,
              TOTALTOPTIERVOLUME24H: 2584883.3953427817,
              TOTALTOPTIERVOLUME24HTO: 3304146490.5812416,
              IMAGEURL: '/media/37746238/eth.png',
            },
          },
        },
        DISPLAY: {
          ETH: {
            USD: {
              FROMSYMBOL: 'Ξ',
              TOSYMBOL: '$',
              MARKET: 'CryptoCompare Index',
              PRICE: '$ 1,276.75',
              LASTUPDATE: 'Just now',
              LASTVOLUME: 'Ξ 0.6333',
              LASTVOLUMETO: '$ 808.88',
              LASTTRADEID: '34667055',
              VOLUMEDAY: 'Ξ 287,782.6',
              VOLUMEDAYTO: '$ 367,505,833.0',
              VOLUME24HOUR: 'Ξ 573,086.1',
              VOLUME24HOURTO: '$ 735,584,356.1',
              OPENDAY: '$ 1,282.68',
              HIGHDAY: '$ 1,292.33',
              LOWDAY: '$ 1,254.60',
              OPEN24HOUR: '$ 1,298.03',
              HIGH24HOUR: '$ 1,311.05',
              LOW24HOUR: '$ 1,253.35',
              LASTMARKET: 'binanceusa',
              VOLUMEHOUR: 'Ξ 22,103.9',
              VOLUMEHOURTO: '$ 28,158,189.6',
              OPENHOUR: '$ 1,269.67',
              HIGHHOUR: '$ 1,277.56',
              LOWHOUR: '$ 1,268.24',
              TOPTIERVOLUME24HOUR: 'Ξ 573,086.1',
              TOPTIERVOLUME24HOURTO: '$ 735,584,356.1',
              CHANGE24HOUR: '$ -21.28',
              CHANGEPCT24HOUR: '-1.64',
              CHANGEDAY: '$ -5.93',
              CHANGEPCTDAY: '-0.46',
              CHANGEHOUR: '$ 7.08',
              CHANGEPCTHOUR: '0.56',
              CONVERSIONTYPE: 'direct',
              CONVERSIONSYMBOL: '',
              SUPPLY: 'Ξ 122,373,863.5',
              MKTCAP: '$ 156.24 B',
              MKTCAPPENALTY: '0 %',
              CIRCULATINGSUPPLY: 'Ξ 122,373,863.5',
              CIRCULATINGSUPPLYMKTCAP: '$ 156.24 B',
              TOTALVOLUME24H: 'Ξ 2.59 M',
              TOTALVOLUME24HTO: '$ 3.32 B',
              TOTALTOPTIERVOLUME24H: 'Ξ 2.58 M',
              TOTALTOPTIERVOLUME24HTO: '$ 3.30 B',
              IMAGEURL: '/media/37746238/eth.png',
            },
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 21 Oct 2022 13:08:55 GMT',
        'Content-Type',
        'application/json; charset=UTF-8',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Content-Security-Policy',
        "frame-ancestors 'none'",
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers',
        'Content-Type, Cookie, Set-Cookie, Authorization',
        'Access-Control-Allow-Credentials',
        'true',
        'Cache-Control',
        'public, max-age=10',
        'X-CryptoCompare-Cache-HIT',
        'true',
        'X-CryptoCompare-Server-Id',
        'ccc-api12',
      ],
    )
    .persist()

export const mockVwapSuccess = (): nock.Scope =>
  nock('https://min-api.cryptocompare.com', {
    encodedQueryParams: true,
  })
    .get('/data/dayAvg')
    .query({ fsym: 'AMPL', tsym: 'USD', toTs: /.+/i })
    .reply(200, { USD: 0.9224, ConversionType: { type: 'direct', conversionSymbol: '' } }, [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

const base = 'ETH'
const quote = 'BTC'
const price = 1234

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        TYPE: '4000',
        MESSAGE: 'SESSIONWELCOME',
      }),
    )
    const parseMessage = () => {
      socket.send(
        JSON.stringify({
          TYPE: '4005',
          MESSAGE: 'SUBSCRIPTION_ACCEPTED',
          SUPPORTED_MESSAGE_TYPES: ['1101', '266', '985', '987'],
          SUBSCRIPTION_ID: `1101~{cadli~${base}-${quote}}`,
        }),
      )
      socket.send(
        JSON.stringify({
          TYPE: '4007',
          MESSAGE: 'SUBSCRIPTION_ADD_COMPLETE',
          INFO: 'All valid subscriptions have been added.',
          ACCEPTED_SUBSCRIPTIONS: 1,
          REJECTED_SUBSCRIPTIONS: 0,
        }),
      )
      socket.send(
        JSON.stringify({
          TYPE: '985',
          INSTRUMENT: 'ETH-BTC',
          CCSEQ: 20735164,
          MARKET: 'cadli',
          VALUE: 0.0492344509006993,
          VALUE_FLAG: 'DOWN',
          VALUE_LAST_UPDATE_TS: 1713975478,
          VALUE_LAST_UPDATE_TS_NS: 603000000,
          CURRENT_HOUR_VOLUME: 64381.2572711617,
          CURRENT_HOUR_QUOTE_VOLUME: 3166.48328711479,
          CURRENT_HOUR_VOLUME_TOP_TIER: 36224.9797102,
          CURRENT_HOUR_QUOTE_VOLUME_TOP_TIER: 1781.54419073824,
          CURRENT_HOUR_VOLUME_DIRECT: 0,
          CURRENT_HOUR_QUOTE_VOLUME_DIRECT: 0,
          CURRENT_HOUR_VOLUME_TOP_TIER_DIRECT: 0,
          CURRENT_HOUR_QUOTE_VOLUME_TOP_TIER_DIRECT: 0,
          CURRENT_HOUR_OPEN: 0.0491456586967143,
          CURRENT_HOUR_HIGH: 0.0493759104685501,
          CURRENT_HOUR_LOW: 0.0490585113292235,
          CURRENT_HOUR_TOTAL_INDEX_UPDATES: 0,
          CURRENT_HOUR_CHANGE: 0.000088792203985,
          CURRENT_HOUR_CHANGE_PERCENTAGE: 0.180671510647463,
        }),
      )
    }
    socket.on('message', parseMessage)
  })
  return mockWsServer
}
