import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockResponseSuccess = (): nock.Scope =>
    nock('https://dataproviderapi.com', {
      encodedQueryParams: true,
    })
      .get('/cryptocurrency/price')
      .query({
        symbol: 'ETH',
        convert: 'USD',
      })
      .reply(200, () => ({ ETH: { price: 10000 } }), [
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


export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
    const mockWsServer = new MockWebsocketServer(URL, { mock: false })
    mockWsServer.on('connection', (socket) => {
      socket.on('message', (message) => {
          return socket.send(
            JSON.stringify({
              success: true,
              price: 1000,
              base: 'ETH',
              quote: 'USD',
              time: '1999999'
            }),
          )
      })
    })

    return mockWsServer
  }
