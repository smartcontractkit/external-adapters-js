import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const wsResponse = {
    service: 'crypto_data',
    messageType: 'A',
    data: ['SA', 'wsteth/eth', '2022-03-02T19:37:08.102119+00:00', 'tiingo', 1.1807636997924935],
  }
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(wsResponse))
    })
  })

  return mockWsServer
}
