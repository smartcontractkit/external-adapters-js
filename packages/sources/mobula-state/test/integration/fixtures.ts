import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      return socket.send(
        JSON.stringify({
          timestamp: 1726648165000,
          price: 2325.847186068699,
          marketDepthUSDUp: 1097741407.1171298,
          marketDepthUSDDown: 1032495335.1741029,
          volume24h: 230120379.9751866,
          baseSymbol: 'ETH',
          quoteSymbol: 'USD',
        }),
      )
    })
  })

  return mockWsServer
}
