import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
export function mockPriceEndpoint(): nock.Scope {
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query({ events: 'Trade,Quote', symbols: 'TSLA' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          TSLA: {
            eventSymbol: 'TSLA',
            eventTime: 0,
            time: 1636744209248,
            timeNanoPart: 0,
            sequence: 775394,
            exchangeCode: 'V',
            price: 239.255,
            change: 0.03,
            size: 3,
            dayVolume: 700004,
            dayTurnover: 167577930,
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 19:10:13 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools1',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools1',
      ],
    )
    .persist()
}

export const mockWebSocketServer = (URL: string): MockWebsocketServer => {
  const quoteReponse = [
    {
      data: [
        'Quote',
        ['TSLA', 0, 0, 0, 1670868378000, 'V', 170.0, 148.0, 1670868370000, 'V', 172.0, 100.0],
      ],
      channel: '/service/data',
    },
  ]

  const noBidQuoteReponse = [
    {
      data: [
        'Quote',
        ['NO_BID', 0, 0, 0, 1670868378000, 'V', 0, 148.0, 1670868370000, 'V', 172.0, 100.0],
      ],
      channel: '/service/data',
    },
  ]
  const noAskQuoteReponse = [
    {
      data: [
        'Quote',
        ['NO_ASK', 0, 0, 0, 1670868378000, 'V', 170.0, 148.0, 1670868370000, 'V', 0, 100.0],
      ],
      channel: '/service/data',
    },
  ]
  const invalidQuoteReponse = [
    {
      data: [
        'Quote',
        ['INVALID_DATA', 0, 0, 0, 1670868378000, 'V', 170.0, 148.0, 1670868370000, 'V', 0],
      ],
      channel: '/service/data',
    },
  ]
  const noVolumeReponse = [
    {
      data: [
        'Quote',
        ['NO_VOLUME', 0, 0, 0, 17642052000, 'X', 579.99, 'NaN', 17642052000, 'X', 639.69, 'NaN'],
      ],
      channel: '/service/data',
    },
  ]
  const tradeResponse = [
    {
      data: [
        'Trade',
        [
          'TSLA',
          0,
          1762376399006,
          0,
          12840,
          'V',
          462.19, // price
          0,
          105,
          20398,
          569033,
          262343820.84,
          'ZERO_UP',
          true,
        ],
      ],
      channel: '/service/data',
    },
  ]
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(
      JSON.stringify([
        {
          channel: '/meta/connect',
        },
      ]),
    )
    socket.on('message', () => {
      socket.send(JSON.stringify(quoteReponse))
      socket.send(JSON.stringify(noBidQuoteReponse))
      socket.send(JSON.stringify(noAskQuoteReponse))
      socket.send(JSON.stringify(invalidQuoteReponse))
      socket.send(JSON.stringify(noVolumeReponse))
      socket.send(JSON.stringify(tradeResponse))
    })
  })

  return mockWsServer
}
