import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const MARK_PRICE_MESSAGE = {
  event: 'mark_price',
  data: {
    id: 'btcusdt',
    exchange: 'binance',
    symbol: 'BTCUSDT',
    price: '97500.50',
    timestamp: '2026-03-12T15:24:40Z',
  },
}

const TOP_OF_BOOK_MESSAGE = {
  event: 'top_of_book',
  data: {
    id: 'btcusdt',
    exchange: 'binance',
    symbol: 'BTCUSDT',
    bid_price: '97480.00',
    ask_price: '97520.00',
    timestamp: '2026-03-12T15:24:40Z',
  },
}

export const mockMarketPriceWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    setTimeout(() => socket.send(JSON.stringify(MARK_PRICE_MESSAGE)), 100)
    setTimeout(() => socket.send(JSON.stringify(TOP_OF_BOOK_MESSAGE)), 101)
  })
  return mockWsServer
}
