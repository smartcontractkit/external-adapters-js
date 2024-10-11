import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const mockResponse = {
  blockTime: '2024-10-07 12:08:16',
  baseSymbol: 'WSTETH',
  quoteSymbol: 'ETH',
  aggregatedStatePrice: '1.1803771088055002',
  aggregatedStatePriceUSD: '2915.342952525309',
  aggregatedMarketDepthBaseToken: '10.03501652567594',
  aggregatedMarketDepthBaseTokenUSD: '29148.65737948408',
  aggregatedMarketDepthQuoteToken: '10.101795207509173',
  aggregatedMarketDepthQuoteTokenUSD: '24949.82090585302',
  totalTradingVolume: '111588.35323052094',
}

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      return socket.send(JSON.stringify(mockResponse))
    })
  })

  return mockWsServer
}
