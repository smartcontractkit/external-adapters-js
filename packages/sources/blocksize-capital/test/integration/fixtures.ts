import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
export const mockPriceResponse = {
  jsonrpc: '2.0',
  method: 'vwap',
  params: {
    updates: [
      {
        ticker: 'LINKETH',
        price: 0.003893549745197962,
        size: 76.53,
        volume: 0.297973362,
      },
      {
        ticker: 'ETHEUR',
        price: 2400.209999999564,
        size: 0.06804130000001375,
        volume: 163.31340867300332,
      },
    ],
  },
}

export const mockLwbaResponse = {
  jsonrpc: '2.0',
  method: 'bidask',
  params: {
    updates: [
      {
        ticker: 'BTCUSD',
        agg_bid_price: '27202.99036601005',
        agg_bid_size: '36.57941309',
        agg_ask_price: '27206.54222704013',
        agg_ask_size: '6.76037062',
        agg_mid_price: '27204.76629652509',
        ts: 1693425803031000,
      },
      {
        ticker: 'ETHUSD',
        agg_bid_price: '1701.844873967814',
        agg_bid_size: '208.51838798',
        agg_ask_price: '1702.223427255888',
        agg_ask_size: '11.44083383',
        agg_mid_price: '1702.034150611851',
        ts: 1693425803028000,
      },
      {
        ticker: 'LINKUSD',
        agg_bid_price: '123.123',
        agg_bid_size: '208.51838798',
        agg_ask_price: '123.124',
        agg_ask_size: '11.44083383',
        agg_mid_price: '123.125',
        ts: 1693425803029000,
      },
    ],
  },
}

export const mockFixedVwapSnapshotResponse = {
  jsonrpc: '2.0',
  result: {
    snapshot: [
      {
        ticker: 'AMPLUSD',
        price: 1.7748077041598187,
        size: 451648.70693599945,
        volume: 801589.604643832,
        ts: 1670630400000,
      },
    ],
  },
}

export const mockLoginResponse = {
  jsonrpc: '2.0',
  id: 0,
  result: {
    user_id: 'ABCD',
  },
}

export const mockWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const data = JSON.stringify(mockPriceResponse)
    const lwbaData = JSON.stringify(mockLwbaResponse)
    socket.on('message', (message) => {
      const parsed = JSON.parse(message.toString())
      if (parsed.params?.api_key) {
        socket.send(JSON.stringify(mockLoginResponse))
      } else if (parsed?.method === 'bidask_subscribe') {
        socket.send(lwbaData)
      } else if (parsed?.method === 'fixedvwap_subscribe') {
        socket.send(JSON.stringify(mockFixedVwapSnapshotResponse))
      } else {
        // method === 'vwap'
        socket.send(data)
      }
    })
  })
  return mockWsServer
}
