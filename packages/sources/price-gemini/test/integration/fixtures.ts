import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const mockResponse = { changes: [['buy', '59033.55', '0.5']], symbol: 'BTCUSD', type: 'l2_updates' }

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      return socket.send(JSON.stringify(mockResponse))
    })
  })

  return mockWsServer
}
