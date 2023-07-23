import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
export const mockSubscribeResponse = {
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
    const data = JSON.stringify(mockSubscribeResponse)
    socket.on('message', (message) => {
      const parsed = JSON.parse(message.toString())
      if (parsed.params?.api_key) {
        socket.send(JSON.stringify(mockLoginResponse))
      } else {
        socket.send(data)
      }
    })
  })
  return mockWsServer
}
