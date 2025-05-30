import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(
        JSON.stringify({
          timestamp: 1726648165000,
          price: 2325.847186068699,
          marketDepthUSDUp: 1097741407.1171298,
          marketDepthUSDDown: 1032495335.1741029,
          volume24h: 230120379.9751866,
          baseSymbol: 'ETH',
          quoteSymbol: 'USD',
        }),
      )

      socket.send(
        JSON.stringify({
          binanceFundingRate: {
            symbol: 'BTCUSDC',
            fundingTime: 1740441600000,
            fundingRate: 0.009854,
            marketPrice: '91505.25655876',
            epochDurationMs: 28800000,
          },
          deribitFundingRate: {
            symbol: 'BTC',
            fundingTime: 1740466800000,
            fundingRate: 0.00573193029855309,
            marketPrice: 91250.36,
            epochDurationMs: 28800000,
          },
          queryDetails: { base: 'BTC', quote: null },
        }),
      )

      socket.send(
        JSON.stringify({
          binanceFundingRate: {
            symbol: 'AERGOUSDT',
            fundingTime: 1747368000001,
            fundingRate: -0.00059603,
            marketPrice: '0.15456000',
            epochDurationMs: 14400000,
            fundingRateCap: 2,
            fundingRateFloor: -2,
          },
          deribitFundingRate: null,
          queryDetails: { base: 'AERGO', quote: null },
        }),
      )
    })
  })

  return mockWsServer
}
