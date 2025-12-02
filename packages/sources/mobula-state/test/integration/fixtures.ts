import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })

  // Map of asset_id to mock responses - simulates Mobula v2 API targeted subscriptions
  const priceResponses: Record<string, any[]> = {
    // EZETH responses
    '102478632': [
      {
        timestamp: 1514764861000 + 500,
        price: 4233.15,
        marketDepthUSDUp: 1097741407.1171298,
        marketDepthUSDDown: 1032495335.1741029,
        volume24h: 230120379.9751866,
        baseSymbol: 'EZETH',
        quoteSymbol: 'USD',
        baseID: '102478632',
        quoteID: 'USD',
      },
      {
        timestamp: 1514764861000 + 500,
        price: 1.0612,
        marketDepthUSDUp: 500000,
        marketDepthUSDDown: 450000,
        volume24h: 15000,
        baseSymbol: 'EZETH',
        quoteSymbol: 'ETH',
        baseID: '102478632',
        quoteID: '100004304',
      },
      {
        timestamp: 1514764861000 + 500,
        price: 1.0612,
        marketDepthUSDUp: 500000,
        marketDepthUSDDown: 450000,
        volume24h: 15000,
        baseSymbol: 'EZETH',
        quoteSymbol: 'CUSTOMQUOTE',
        baseID: '102478632',
        quoteID: '100004304',
      },
    ],
    // BTC responses
    '100001656': [
      {
        timestamp: 1514764861000 + 500,
        price: 96234.56,
        marketDepthUSDUp: 5000000000,
        marketDepthUSDDown: 4800000000,
        volume24h: 50000000000,
        baseSymbol: 'BTC',
        quoteSymbol: 'USD',
        baseID: '100001656',
        quoteID: 'USD',
      },
    ],
    // ETH responses
    '100004304': [
      {
        timestamp: 1514764861000 + 500,
        price: 3456.78,
        marketDepthUSDUp: 2000000000,
        marketDepthUSDDown: 1900000000,
        volume24h: 20000000000,
        baseSymbol: 'ETH',
        quoteSymbol: 'USD',
        baseID: '100004304',
        quoteID: 'USD',
      },
    ],
    // CBETH responses
    '100029813': [
      {
        timestamp: 1514764861000 + 500,
        price: 1.0456,
        marketDepthUSDUp: 800000,
        marketDepthUSDDown: 750000,
        volume24h: 25000,
        baseSymbol: 'CBETH',
        quoteSymbol: 'ETH',
        baseID: '100029813',
        quoteID: '100004304',
      },
    ],
    // LBTC responses
    '102484658': [
      {
        timestamp: 1514764861000 + 500,
        price: 0.9985,
        marketDepthUSDUp: 1200000,
        marketDepthUSDDown: 1100000,
        volume24h: 35000,
        baseSymbol: 'LBTC',
        quoteSymbol: 'BTC',
        baseID: '102484658',
        quoteID: '100001656',
      },
      {
        timestamp: 1514764861000 + 500,
        price: 3.456,
        marketDepthUSDUp: 1200000,
        marketDepthUSDDown: 1100000,
        volume24h: 35000,
        baseSymbol: 'LBTC',
        quoteSymbol: 'SOL',
        baseID: '102484658',
        quoteID: '100010811',
      },
    ],
    // GHO responses
    '2921': [
      {
        timestamp: 1514764861000 + 500,
        price: 1.0012,
        marketDepthUSDUp: 300000,
        marketDepthUSDDown: 290000,
        volume24h: 50000,
        baseSymbol: 'GHO',
        quoteSymbol: 'USD',
        baseID: '2921',
        quoteID: 'USD',
      },
      {
        timestamp: 1514764861000 + 500,
        price: 0.0000102,
        marketDepthUSDUp: 300000,
        marketDepthUSDDown: 290000,
        volume24h: 50000,
        baseSymbol: 'GHO',
        quoteSymbol: 'BTC',
        baseID: '2921',
        quoteID: '100001656',
      },
    ],
    // Override test responses
    '999888777': [
      {
        timestamp: 1514764861000 + 500,
        price: 125.67,
        marketDepthUSDUp: 150000,
        marketDepthUSDDown: 140000,
        volume24h: 75000,
        baseSymbol: 'TESTCOIN',
        quoteSymbol: 'USD',
        baseID: '999888777',
        quoteID: 'USD',
      },
    ],
    '111222333': [
      {
        timestamp: 1514764861000 + 500,
        price: 0.00123456,
        marketDepthUSDUp: 90000,
        marketDepthUSDDown: 85000,
        volume24h: 12000,
        baseSymbol: 'ANOTHERCOIN',
        quoteSymbol: 'BTC',
        baseID: '111222333',
        quoteID: '100001656',
      },
    ],
    '444555666': [
      {
        timestamp: 1514764861000 + 500,
        price: 0.0456789,
        marketDepthUSDUp: 60000,
        marketDepthUSDDown: 55000,
        volume24h: 8500,
        baseSymbol: 'CUSTOMTOKEN',
        quoteSymbol: 'ETH',
        baseID: '444555666',
        quoteID: '100004304',
      },
    ],
  }

  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      // Skip if message is undefined (happens when subscribeMessage returns undefined)
      if (!message) {
        return
      }
      const parsed = JSON.parse(message as string)

      // Handle Mobula v2 price subscriptions (asset_ids based)
      if (parsed.kind === 'asset_ids' && parsed.asset_ids && parsed.asset_ids.length > 0) {
        const assetId = parsed.asset_ids[0].toString()
        const responses = priceResponses[assetId]

        if (responses) {
          // Send all price responses for this asset (different quote currencies)
          responses.forEach((response: any) => {
            socket.send(JSON.stringify(response))
          })
        }
      }

      // Handle funding rate subscriptions
      if (parsed.type === 'funding' && parsed.payload) {
        const symbol = parsed.payload.symbol

        if (symbol === 'BTC') {
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
        } else if (symbol === 'AERGO') {
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
        }
      }
    })
  })

  return mockWsServer
}
