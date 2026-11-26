import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockStockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
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

export const mockMarkPriceWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      return socket.send(
        JSON.stringify({
          type: 'mark_price',
          exchange: 'pv_01',
          contract: 'BTCUSDT',
          channel: 'perpetuals.marks',
          bid: '4999',
          mid: '5000',
          ask: '5001',
          heartbeat_at: '2026-01-01T00:00:00.000Z',
          timestamp: '2026-01-01T00:00:00.000Z',
        }),
      )
    })
  })

  return mockWsServer
}

export const mockStockQuotesWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const { channels, symbols }: { channels?: string[]; symbols?: string[] } = JSON.parse(
        String(message),
      )
      const symbol = symbols?.[0]
      if (channels?.includes('futures.quotes')) {
        return socket.send(
          JSON.stringify({
            type: 'quote',
            channel: 'futures.quotes',
            asset: 'futures',
            symbol: symbols?.[0],
            bid: '5000',
            ask: '5001',
            bid_size: '10',
            ask_size: '11',
            price: '5000.5',
            last_trade_date: '2026-12-18',
            roll_date: '2026-11-20',
            contract_month: '2026-12',
            trading_day_of_month: 15,
            trading_days_in_month: 22,
            rolls: {
              r5: { price: '5002' },
              r5c: { price: '5003' },
            },
            ts: 1999999,
          }),
        )
      }
      if (channels?.includes('overnight.quotes')) {
        // The provider reports every overnight quote with asset "stocks" and without
        // bid/ask sizes, regardless of the asset type of the underlying symbol.
        return socket.send(
          JSON.stringify({
            type: 'quote',
            channel: 'overnight.quotes',
            asset: 'stocks',
            symbol: 'US:AAPL',
            session: 'overnight',
            bid: '1000',
            ask: '1001',
            mid: '1000.4',
            ts: 1999999,
          }),
        )
      }
      if (channels?.includes('commodities.quotes')) {
        return socket.send(
          JSON.stringify({
            type: 'quote',
            channel: 'commodities.quotes',
            asset: 'commodities',
            symbol,
            bid: '4000',
            ask: '4001',
            bid_size: '5',
            ask_size: '6',
            ts: 1999999,
          }),
        )
      }
      if (channels?.includes('forex.quotes')) {
        return socket.send(
          JSON.stringify({
            type: 'quote',
            channel: 'forex.quotes',
            asset: 'forex',
            symbol,
            bid: '2000',
            ask: '2002',
            bid_size: '7',
            ask_size: '8',
            ts: 1999999,
          }),
        )
      }
      return socket.send(
        JSON.stringify({
          type: 'quote',
          channel: 'stocks.quotes',
          asset: 'stocks',
          symbol: 'US:AAPL',
          bid: '1000',
          ask: '1001',
          bid_size: '3',
          ask_size: '4',
          ts: 1999999,
        }),
      )
    })
  })

  return mockWsServer
}
