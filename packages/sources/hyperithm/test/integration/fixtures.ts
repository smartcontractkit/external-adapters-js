import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          ask: '425.8',
          askVolume: '1314600',
          bid: '425.8',
          bidVolume: '1358400',
          lastTradedPrice: '426.6',
          mid: '425.8',
          symbol: '700/HKD',
          timestamp: 1789632460600176,
          type: 'equity',
        }),
      )
    })
  })

  return mockWsServer
}
