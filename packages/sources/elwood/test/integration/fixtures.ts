import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockSubscribeResponse = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockUnsubscribeResponse = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'unsubscribe',
      stream: 'index',
      symbol: 'ETH-USD',
      index_freq: 1000,
    })
    .reply(200, {}, [])
}

export const mockSubscribeError = (apiKey: string) => {
  nock(`https://api.chk.elwood.systems`, { encodedQueryParams: true })
    .persist()
    .post(`/v1/stream?apiKey=${apiKey}`, {
      action: 'subscribe',
      stream: 'index',
      symbol: 'XXX-USD',
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
                price: '10000',
                symbol: 'ETH-USD',
                timestamp: '2022-11-08T04:18:18.736534617Z',
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
