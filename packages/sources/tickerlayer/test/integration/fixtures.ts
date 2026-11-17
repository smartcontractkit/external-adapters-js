import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockStockWebsocketServer = (URL: string): MockWebsocketServer => {
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

export const mockStockQuotesWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const { channels }: { channels?: string[] } = JSON.parse(String(message))
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
            symbol: 'XAUUSD',
            bid: '4000',
            ask: '4001',
            bid_size: '5',
            ask_size: '6',
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
