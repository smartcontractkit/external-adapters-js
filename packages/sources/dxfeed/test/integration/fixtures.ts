import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
export function mockPriceEndpoint(): nock.Scope {
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query({ events: 'Trade,Quote', symbols: 'TSLA:BFX' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'TSLA:BFX': {
            eventSymbol: 'TSLA:BFX',
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
  const wsReponse = [
    {
      data: [
        'Quote',
        ['TSLA:BFX', 0, 0, 0, 1670868378000, 'V', 170.0, 148.0, 1670868370000, 'V', 172.0, 100.0],
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
      socket.send(JSON.stringify(wsReponse))
    })
  })

  return mockWsServer
}
