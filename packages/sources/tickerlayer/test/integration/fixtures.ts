import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          type: 'trade',
          channel: 'stocks.trades',
          asset: 'stocks',
          symbol: 'US:AAPL',
          price: '1000',
          size: '3',
          ts: 1999999,
        }),
      )
    })
  })

  return mockWsServer
}
