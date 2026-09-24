import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_message) => {
      return socket.send(
        JSON.stringify({
          type: 'aggregated_price_update',
          timestamp: '2026-09-24T07:11:12.933191+00:00',
          data: {
            depth_minus_1pct_usd: 20562484.17448587,
            price: 2964.373384323081,
            data_status: 'forward_filled',
            quote: 'USD',
            volume_7d_usd: 15675224.411699021,
            block_time: '2026-09-24T07:11:10Z',
            base: 'weETH',
            depth_plus_1pct_usd: 7512627.8857508795,
            market_status: null,
          },
        }),
      )
    })
  })

  return mockWsServer
}
