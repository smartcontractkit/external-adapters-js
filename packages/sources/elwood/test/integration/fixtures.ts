import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockSubscriptionsResponse = (apiKey: string, symbols: string[]) => {
  return nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .get(`/v1/stream/subscriptions?apiKey=${apiKey}`)
    .reply(
      200,
      {
        data: {
          items: symbols.map((symbol) => ({
            stream: 'index',
            symbol,
            index_freq: 1000,
          })),
        },
      },
      [],
    )
}

export const mockSubscribeResponse = (apiKey: string, symbol: string) => {
  return nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol,
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockUnsubscribeResponse = (apiKey: string, symbol: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'unsubscribe',
      stream: 'index',
      symbol,
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockSubscribeError = (apiKey: string, symbol: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol,
      index_freq: 1000,
    })
    .reply(400, {
      error: {
        code: 400,
        message: 'Symbol is not supported',
        errors: [
          {
            domain: 'stream',
          },
        ],
      },
    })
}

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(
        () =>
          socket.send(
            JSON.stringify({
              type: 'Index',
              data: {
                bid: '10000',
                price: '10001',
                ask: '10002',
                symbol: 'ETH-USD',
                timestamp: '2022-11-08T04:18:18.736534617Z',
              },
              sequence: 123,
            }),
          ),
        10,
      )
      setTimeout(
        () =>
          socket.send(
            JSON.stringify({
              type: 'Index',
              data: {
                bid: '10001',
                price: '10000',
                ask: '10002',
                symbol: 'BTC-USD',
                timestamp: '2022-11-08T04:18:19.736534617Z',
              },
              sequence: 123,
            }),
          ),
        10,
      )
      setTimeout(
        () =>
          socket.send(
            JSON.stringify({
              type: 'Index',
              data: {
                bid: '32.16',
                price: '32.17',
                ask: '32.18',
                symbol: 'AVAX-USD',
                timestamp: '2022-11-08T04:18:20.736534617Z',
              },
              sequence: 123,
            }),
          ),
        10,
      )
    }
    parseMessage()
  })
  return mockWsServer
}
