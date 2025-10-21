import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      // EZETH/USD - Test includes.json mapping
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 4233.15,
          marketDepthUSDUp: 1097741407.1171298,
          marketDepthUSDDown: 1032495335.1741029,
          volume24h: 230120379.9751866,
          baseSymbol: 'EZETH',
          quoteSymbol: 'USD',
          baseID: '102478632',
          quoteID: 'USD',
        }),
      )

      // EZETH/ETH - Test hardcoded ETH quote and composite key
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 1.0612,
          marketDepthUSDUp: 500000,
          marketDepthUSDDown: 450000,
          volume24h: 15000,
          baseSymbol: 'EZETH',
          quoteSymbol: 'ETH',
          baseID: '102478632',
          quoteID: '100004304',
        }),
      )

      // CBETH/ETH - Test includes.json mapping with hardcoded ETH quote
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 1.0456,
          marketDepthUSDUp: 800000,
          marketDepthUSDDown: 750000,
          volume24h: 25000,
          baseSymbol: 'CBETH',
          quoteSymbol: 'ETH',
          baseID: '100029813',
          quoteID: '100004304',
        }),
      )

      // LBTC/BTC - Test includes.json mapping with hardcoded BTC quote
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 0.9985,
          marketDepthUSDUp: 1200000,
          marketDepthUSDDown: 1100000,
          volume24h: 35000,
          baseSymbol: 'LBTC',
          quoteSymbol: 'BTC',
          baseID: '102484658',
          quoteID: '100001656',
        }),
      )

      // GHO/USD - Test includes.json mapping
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 1.0012,
          marketDepthUSDUp: 300000,
          marketDepthUSDDown: 290000,
          volume24h: 50000,
          baseSymbol: 'GHO',
          quoteSymbol: 'USD',
          baseID: '2921',
          quoteID: 'USD',
        }),
      )

      // TESTCOIN/USD - Test base override functionality
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 125.67,
          marketDepthUSDUp: 150000,
          marketDepthUSDDown: 140000,
          volume24h: 75000,
          baseSymbol: 'TESTCOIN',
          quoteSymbol: 'USD',
          baseID: '999888777', // Override asset ID
          quoteID: 'USD',
        }),
      )

      // ANOTHERCOIN/BTC - Test base override with hardcoded BTC quote
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 0.00123456,
          marketDepthUSDUp: 90000,
          marketDepthUSDDown: 85000,
          volume24h: 12000,
          baseSymbol: 'ANOTHERCOIN',
          quoteSymbol: 'BTC',
          baseID: '111222333', // Override asset ID
          quoteID: '100001656', // BTC hardcoded quote
        }),
      )

      // CUSTOMTOKEN/ETH - Test base override with hardcoded ETH quote
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 0.0456789,
          marketDepthUSDUp: 60000,
          marketDepthUSDDown: 55000,
          volume24h: 8500,
          baseSymbol: 'CUSTOMTOKEN',
          quoteSymbol: 'ETH',
          baseID: '444555666', // Override asset ID
          quoteID: '100004304', // ETH hardcoded quote
        }),
      )

      // EZETH/CUSTOMQUOTE - Test quote override (CUSTOMQUOTE overridden to ETH asset ID)
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 1.0612,
          marketDepthUSDUp: 500000,
          marketDepthUSDDown: 450000,
          volume24h: 15000,
          baseSymbol: 'EZETH',
          quoteSymbol: 'CUSTOMQUOTE',
          baseID: '102478632', // EZETH asset ID
          quoteID: '100004304', // ETH asset ID (from quote override)
        }),
      )

      // Direct asset ID usage: 102478632/USD (EZETH asset ID as base)
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 4233.15,
          marketDepthUSDUp: 1097741407.1171298,
          marketDepthUSDDown: 1032495335.1741029,
          volume24h: 230120379.9751866,
          baseSymbol: 'EZETH',
          quoteSymbol: 'USD',
          baseID: '102478632',
          quoteID: 'USD',
        }),
      )

      // Direct asset ID usage: 2921/100001656 (GHO/BTC using asset IDs)
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 0.0000102,
          marketDepthUSDUp: 300000,
          marketDepthUSDDown: 290000,
          volume24h: 50000,
          baseSymbol: 'GHO',
          quoteSymbol: 'BTC',
          baseID: '2921',
          quoteID: '100001656',
        }),
      )

      // Direct asset ID usage: 100029813/100004304 (CBETH/ETH using asset IDs)
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 1.0456,
          marketDepthUSDUp: 800000,
          marketDepthUSDDown: 750000,
          volume24h: 25000,
          baseSymbol: 'CBETH',
          quoteSymbol: 'ETH',
          baseID: '100029813',
          quoteID: '100004304',
        }),
      )

      // Direct asset ID usage: 102484658/100010811 (LBTC/SOL using asset IDs)
      socket.send(
        JSON.stringify({
          timestamp: 4040,
          price: 3.456,
          marketDepthUSDUp: 1200000,
          marketDepthUSDDown: 1100000,
          volume24h: 35000,
          baseSymbol: 'LBTC',
          quoteSymbol: 'SOL',
          baseID: '102484658',
          quoteID: '100010811',
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
