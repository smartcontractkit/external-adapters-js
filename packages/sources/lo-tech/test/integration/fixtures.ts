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
            symbol: 'WTIV6', // V = October, 6 = 2026
            exchange: 'NYMEX',
            generic_symbol: 'WTI/1',
            sequence_id: 211440,
            ingress_ts: Date.now() * 1000 - 50,
            publish_ts: Date.now() * 1000 - 100,
            transaction_ts: null,
            price: 90.406,
            spread: 0.01,
            price_notice_roll: 90.406,
            price_goldman_roll: 90.406,
            price_continuous_roll: 89.3332380952381,
            expiry_date: '2026-09-22',
            roll_date: '2026-09-22',
            first_notice_date: '2026-09-30',
            trading_day_of_month: 3,
            trading_days_in_month: 21,
          },
        }),
      )
    })
  })

  return mockWsServer
}
