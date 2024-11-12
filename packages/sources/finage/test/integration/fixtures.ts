import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/last/stocks')
    .query({ apikey: 'fake-api-key', symbols: 'AAPL' })
    .reply(
      200,
      () => [
        {
          symbol: 'AAPL',
          ask: 26.32,
          bid: 25.8,
          asize: 13,
          bsize: 1,
          timestamp: 1628899200621,
        },
      ],
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
    .get('/agg/stock/prev-close/ETH')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      () => ({
        symbol: 'ETH',
        totalResults: 1,
        results: [{ o: 26.79, h: 26.85, l: 26.02, c: 26.3, v: 367009, t: 1628884800000 }],
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
    .get('/last/forex/GBPUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'GBPUSD', ask: 1.34435, bid: 1.34426, timestamp: 1637060382000 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])
    .persist()
    .get('/last/crypto/BTCUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'BTCUSD', price: 50940.12, timestamp: 1638898619885 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])
    .persist()
    .get('/last/trade/forex/WTIUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      {
        symbol: 'WTIUSD',
        price: 98.91,
        timestamp: 1514764861000,
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
    .get('/last/etf/CSPX')
    .query({ apikey: 'fake-api-key', country: 'uk' })
    .reply(200, {
      symbol: 'CSPX',
      price: 445.64,
      timestamp: 1685972473955,
    })
    .persist()
    .get('/last/etf/C3M')
    .query({ apikey: 'fake-api-key' })
    .reply(200, {
      symbol: 'C3M',
      price: 118.78,
      timestamp: 1685972473955,
    })
    .persist()

export const mockStockWebSocketServer = (URL: string): MockWebsocketServer => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the U.S Market source.',
    },
    {
      s: 'AAPL',
      p: 163.58,
      c: [37],
      v: 50,
      dp: false,
      t: 1646154954689,
    },
  ]
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      wsResponse.forEach((message) => {
        socket.send(JSON.stringify(message))
      })
    })
  })

  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): MockWebsocketServer => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the Forex Market source.',
    },
    {
      s: 'GBP/USD',
      a: 1.33139,
      b: 1.3313,
      dd: '-0.0108',
      dc: '-0.8082',
      ppms: false,
      t: 1646157588000,
    },
  ]
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      wsResponse.forEach((message) => {
        socket.send(JSON.stringify(message))
      })
    })
  })

  return mockWsServer
}

export const mockCryptoWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            s: 'BTCUSD',
            p: '43682.66306523',
            q: '0.04582000',
            dex: false,
            src: 'A',
            t: 1646151298290,
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}

export const mockEtfWebSocketServer = (URL: string): MockWebsocketServer => {
  const wsResponse = [
    {
      s: 'CSPX',
      p: 445.76,
      dc: '0.0000',
      dd: '0.0000',
      t: 1514764861000,
    },
    {
      s: 'C3M',
      p: 118.78,
      dc: '0.0000',
      dd: '0.0000',
      t: 1514764861000,
    },
  ]
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => {
        wsResponse.forEach((message) => {
          socket.send(JSON.stringify(message))
        })
      }, 10)
    }
    parseMessage()
  })

  return mockWsServer
}
