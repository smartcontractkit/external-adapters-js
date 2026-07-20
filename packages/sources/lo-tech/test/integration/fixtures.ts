import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string, symbol: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          egress_ts: Date.now() * 1000,
          data: {
            type: 'PRICE',
            symbol,
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

export const mockFuturesWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          egress_ts: Date.now() * 1000,
          data: {
            type: 'PRICE',
            symbol: 'WTIQ6', // Q = August, 6 = 2026
            generic_symbol: 'WTI/1',
            ingress_ts: Date.now() * 1000 - 50,
            price: 80.054,
            spread: 0.02,
            expiry_date: '2026-07-21',
            roll_date: '2026-07-21',
          },
        }),
      )
    })
  })

  return mockWsServer
}
