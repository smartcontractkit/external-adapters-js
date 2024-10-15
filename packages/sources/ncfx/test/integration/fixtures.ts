import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const loginResponse = {
  Type: 'Info',
  Message: 'Successfully Authenticated',
}

export const subscribeResponse = {
  Type: 'Info',
  Message: 'Subscribed to currency pair(s) ETH/USD',
}

export const mockCryptoResponse = {
  timestamp: '2022-08-01T07:14:54.909',
  currencyPair: 'ETH/USD',
  bid: 3106.8495,
  offer: 3107.1275,
  mid: 3106.9885,
}

export const mockCryptoResponseLwba = {
  timestamp: '2022-08-01T07:15:54.909',
  currencyPair: 'AVAX/USD',
  bid: 28.1,
  offer: 28.2,
  mid: 28.15,
}

export const mockCryptoResponseLwbaInvariantViolation = {
  timestamp: '2022-08-01T07:15:54.909',
  currencyPair: 'BTC/USD',
  bid: 3106.8495,
  offer: 3105.1275,
  mid: 3106.9885,
}

export const mockForexResponse = {
  USDAED: { price: 3.673, timestamp: '2022-08-01T07:14:54.909Z' },
  AUDUSD: { price: 0.70067, timestamp: '2022-08-01T07:14:53.604Z' },
  USDBRL: { price: 5.1753, timestamp: '2022-08-01T07:14:54.909Z' },
  USDCAD: { price: 1.27883, timestamp: '2022-08-01T07:14:52.107Z' },
  USDCHF: { price: 0.95044, timestamp: '2022-08-01T07:14:51.958Z' },
  USDCLP: { price: 901.1, timestamp: '2022-08-01T07:14:54.909Z' },
  USDCNY: { price: 6.75175, timestamp: '2022-08-01T07:14:54.909Z' },
  USDCOP: { price: 4279.6, timestamp: '2022-07-31T23:33:59.409Z' },
  EURUSD: { price: 1.02325, timestamp: '2022-08-01T07:14:51.953Z' },
  GBPUSD: { price: 1.21893, timestamp: '2022-08-01T07:14:54.704Z' },
  GBPTRY: { price: 21.88028, timestamp: '2022-08-01T07:14:50.958Z' },
  USDIDR: { price: 14869, timestamp: '2022-08-01T07:14:18.659Z' },
  USDILS: { price: 3.38771, timestamp: '2022-08-01T07:14:54.554Z' },
  USDINR: { price: 79.11, timestamp: '2022-08-01T07:14:50.159Z' },
  USDJPY: { price: 132.214, timestamp: '2022-08-01T07:14:54.308Z' },
  USDKRW: { price: 1303.535, timestamp: '2022-08-01T07:14:53.659Z' },
  USDKWD: { price: 0.30677, timestamp: '2022-08-01T07:14:54.909Z' },
  USDMXN: { price: 20.31813, timestamp: '2022-08-01T07:14:53.553Z' },
  USDMYR: { price: 4.4515, timestamp: '2022-08-01T06:50:10.159Z' },
  USDNGN: { price: 416.37, timestamp: '2022-08-01T06:43:07.659Z' },
  NZDUSD: { price: 0.6301, timestamp: '2022-08-01T07:14:54.306Z' },
  USDPHP: { price: 55.375, timestamp: '2022-08-01T07:06:22.409Z' },
  USDSEK: { price: 10.15963, timestamp: '2022-08-01T07:14:53.605Z' },
  USDSGD: { price: 1.37827, timestamp: '2022-08-01T07:14:54.354Z' },
  USDTRY: { price: 17.94659, timestamp: '2022-08-01T07:14:44.708Z' },
  USDZAR: { price: 16.52181, timestamp: '2022-08-01T07:14:54.406Z' },
  USDCZK: { price: 24.0676, timestamp: '2022-08-01T07:14:52.005Z' },
  USDHRK: { price: 7.34435, timestamp: '2022-08-01T07:14:54.909Z' },
  USDISK: { price: 135.72, timestamp: '2022-08-01T07:14:54.159Z' },
  USDARS: { price: 131.265, timestamp: '2022-08-01T07:14:29.409Z' },
  USDBGN: { price: 1.9113, timestamp: '2022-08-01T07:14:54.909Z' },
  USDHUF: { price: 394.45, timestamp: '2022-08-01T07:14:52.105Z' },
  USDDKK: { price: 7.27512, timestamp: '2022-08-01T07:14:54.057Z' },
  USDNOK: { price: 9.66311, timestamp: '2022-08-01T07:14:54.908Z' },
  USDPLN: { price: 4.63067, timestamp: '2022-08-01T07:14:51.955Z' },
  USDUAH: { price: 36.7015, timestamp: '2022-08-01T07:14:54.909Z' },
  USDMNT: { price: 3171.59, timestamp: '2022-08-01T07:14:54.909Z' },
  USDHKD: { price: 7.84993, timestamp: '2022-08-01T07:10:46.957Z' },
  USDTHB: { price: 36.18, timestamp: '2022-08-01T07:14:54.909Z' },
  AUDCAD: { price: 0.89607, timestamp: '2022-08-01T07:14:54.306Z' },
  AUDCHF: { price: 0.66594, timestamp: '2022-08-01T07:14:53.506Z' },
  AUDJPY: { price: 92.64, timestamp: '2022-08-01T07:14:54.954Z' },
  AUDNOK: { price: 6.76906, timestamp: '2022-08-01T07:14:54.753Z' },
  AUDNZD: { price: 1.11191, timestamp: '2022-08-01T07:14:54.556Z' },
  AUDSEK: { price: 7.1171, timestamp: '2022-08-01T07:14:54.308Z' },
  AUDSGD: { price: 0.96568, timestamp: '2022-08-01T07:14:54.658Z' },
  CADCHF: { price: 0.74315, timestamp: '2022-08-01T07:14:54.955Z' },
  CADJPY: { price: 103.381, timestamp: '2022-08-01T07:14:54.907Z' },
  CHFJPY: { price: 139.1, timestamp: '2022-08-01T07:14:54.506Z' },
  EURAUD: { price: 1.46027, timestamp: '2022-08-01T07:14:54.355Z' },
  EURCAD: { price: 1.30856, timestamp: '2022-08-01T07:14:54.855Z' },
  EURCHF: { price: 0.97255, timestamp: '2022-08-01T07:14:54.357Z' },
  EURCZK: { price: 24.6282, timestamp: '2022-08-01T07:14:52.406Z' },
  EURDKK: { price: 7.4446, timestamp: '2022-08-01T07:10:21.504Z' },
  EURGBP: { price: 0.83943, timestamp: '2022-08-01T07:14:54.157Z' },
  EURHKD: { price: 8.03242, timestamp: '2022-08-01T07:14:52.155Z' },
  EURHUF: { price: 403.651, timestamp: '2022-08-01T07:14:26.008Z' },
  EURJPY: { price: 135.291, timestamp: '2022-08-01T07:14:54.807Z' },
  EURMXN: { price: 20.79071, timestamp: '2022-08-01T07:14:53.304Z' },
  EURNOK: { price: 9.88811, timestamp: '2022-08-01T07:14:54.355Z' },
  EURNZD: { price: 1.62378, timestamp: '2022-08-01T07:14:54.554Z' },
  EURPLN: { price: 4.73845, timestamp: '2022-08-01T07:14:50.903Z' },
  EURRON: { price: 4.92876, timestamp: '2022-08-01T07:13:30.604Z' },
  EURSEK: { price: 10.39645, timestamp: '2022-08-01T07:14:54.155Z' },
  EURSGD: { price: 1.41031, timestamp: '2022-08-01T07:14:53.006Z' },
  EURTRY: { price: 18.36944, timestamp: '2022-08-01T07:14:54.004Z' },
  EURZAR: { price: 16.90345, timestamp: '2022-08-01T07:14:52.207Z' },
  GBPAUD: { price: 1.73953, timestamp: '2022-08-01T07:14:54.807Z' },
  GBPCAD: { price: 1.55884, timestamp: '2022-08-01T07:14:54.707Z' },
  GBPCHF: { price: 1.15852, timestamp: '2022-08-01T07:14:53.503Z' },
  GBPJPY: { price: 161.163, timestamp: '2022-08-01T07:14:54.905Z' },
  GBPMXN: { price: 24.76638, timestamp: '2022-08-01T07:14:53.308Z' },
  GBPNOK: { price: 11.77871, timestamp: '2022-08-01T07:14:54.855Z' },
  GBPNZD: { price: 1.93435, timestamp: '2022-08-01T07:14:54.557Z' },
  GBPPLN: { price: 5.64292, timestamp: '2022-08-01T07:14:51.154Z' },
  GBPSEK: { price: 12.38371, timestamp: '2022-08-01T07:14:54.206Z' },
  GBPSGD: { price: 1.68001, timestamp: '2022-08-01T07:14:51.855Z' },
  GBPZAR: { price: 20.13554, timestamp: '2022-08-01T07:14:54.657Z' },
  NOKSEK: { price: 1.05109, timestamp: '2022-08-01T07:14:54.253Z' },
  NZDCAD: { price: 0.8058, timestamp: '2022-08-01T07:14:54.558Z' },
  NZDCHF: { price: 0.59886, timestamp: '2022-08-01T07:14:54.758Z' },
  NZDJPY: { price: 83.306, timestamp: '2022-08-01T07:14:54.903Z' },
  NZDNOK: { price: 6.08708, timestamp: '2022-08-01T07:14:54.753Z' },
  NZDSEK: { price: 6.39984, timestamp: '2022-08-01T07:14:54.509Z' },
  NZDSGD: { price: 0.86845, timestamp: '2022-08-01T07:14:54.554Z' },
  USDCNH: { price: 6.7605, timestamp: '2022-08-01T07:14:52.853Z' },
  XAGUSD: { price: 20.22, timestamp: '2022-08-01T07:14:54.254Z' },
  XAUUSD: { price: 1766.38, timestamp: '2022-08-01T07:14:54.907Z' },
  USDRON: { price: 4.81666, timestamp: '2022-08-01T07:14:51.854Z' },
  XPTUSD: { price: 903.67, timestamp: '2022-08-01T07:14:54.508Z' },
}

export const mockMarketStatusResponse = {
  marketStatus: {
    fx: 'open',
    metals: 'closed',
  },
  timestamp: '2024-06-20T20:44:09.594Z',
}

export const mockCryptoWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(loginResponse))
    socket.on('message', () => {
      socket.send(JSON.stringify(subscribeResponse))
      socket.send(JSON.stringify(mockCryptoResponse))
      socket.send(JSON.stringify(mockCryptoResponseLwba))
      socket.send(JSON.stringify(mockCryptoResponseLwbaInvariantViolation))
    })
  })
  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(mockForexResponse))
    })
  })
  return mockWsServer
}

export const mockMarketStatusWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    setTimeout(() => {
      socket.send(JSON.stringify(mockMarketStatusResponse))
    }, 0)
  })
  return mockWsServer
}
