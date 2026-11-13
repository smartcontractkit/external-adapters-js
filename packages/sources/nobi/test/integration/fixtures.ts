import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const msolUsdResponse = {
  asset_code: 'Crypto:MSOL/USD',
  block_time: '2026-06-01T23:56:57.116337426Z',
  price: '111.9637335489480836',
  base_symbol: 'MSOL',
  quote_symbol: 'USD',
  depth_usd_plus: '6245764.87954388',
  depth_usd_min: '6183782.58210092',
  volume_7d_usd: '3185001.4416',
}

const btcUsdResponse = {
  asset_code: 'Crypto:BTC/USD',
  block_time: '2026-06-01T23:56:56Z',
  price: '71282.068872305725',
  base_symbol: 'BTC',
  quote_symbol: 'USD',
  depth_usd_plus: '0',
  depth_usd_min: '0',
  volume_7d_usd: '0',
}

export const mockWebsocketServerMultiPair = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(msolUsdResponse))
      socket.send(JSON.stringify(btcUsdResponse))
    })
  })
  return mockWsServer
}
