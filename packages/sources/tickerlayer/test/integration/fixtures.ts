import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          success: true,
          price: 1000,
          base: 'ETH',
          quote: 'USD',
          time: '1999999',
        }),
      )
    })
  })

  return mockWsServer
}
