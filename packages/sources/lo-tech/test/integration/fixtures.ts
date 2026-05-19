import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          egress_ts: Date.now() * 1000,
          data: {
            type: 'PRICE',
            symbol: '9988-HKD:SPOT',
            ingress_ts: Date.now() * 1000 - 50,
            publish_ts: null,
            transaction_ts: Date.now() * 1000 - 50000,
            price: 133.3,
            spread: -0.01,
          },
        }),
      )
    })
  })

  return mockWsServer
}
