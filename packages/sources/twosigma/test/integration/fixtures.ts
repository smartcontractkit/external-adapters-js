import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import { WebSocketMessage, WebSocketRequest } from '../../src/endpoint/price'

export const mockWebSocketServer = (url: string) => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const payload: WebSocketRequest = JSON.parse(message as string)

      const symbolPriceDict: WebSocketMessage['symbol_price_dict'] = {}
      payload.symbols.forEach((symbol, i) => {
        symbolPriceDict[symbol] = {
          quote_currency: 'USD',
          session_status_flag: 'open',
          asset_status_flag: 'active',
          confidence_interval: (i + 1) * 0.1,
          price: (i + 1) * 100,
        }
      })

      socket.send(
        JSON.stringify({
          timestamp: 1645203822,
          symbol_price_dict: symbolPriceDict,
        }),
      )
    })
  })
  return mockWsServer
}
