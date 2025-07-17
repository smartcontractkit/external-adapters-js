import { WsCryptoLwbaSuccessResponse } from '@chainlink/coinmetrics-adapter/src/transport/lwba'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsResponseBody)), 10)
    }
    parseMessage()
  })
  return mockWsServer
}

const wsLwbaResponseBody: WsCryptoLwbaSuccessResponse = {
  pair: 'eth-usd',
  time: '2023-03-08T04:04:33.750000000Z',
  ask_price: '1562.4083581615457',
  ask_size: '31.63132041',
  bid_price: '1562.3384315992228',
  bid_size: '64.67517577',
  mid_price: '1562.3733948803842',
  spread: '0.000044756626394287605',
  cm_sequence_id: '282',
}
export const mockCryptoLwbaWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsLwbaResponseBody)), 10)

      const wsLwbaResponseBodyInvariantViolation = {
        ...wsLwbaResponseBody,
        ask_price: Number(wsLwbaResponseBody.mid_price) - 0.1,
      }
      setTimeout(() => socket.send(JSON.stringify(wsLwbaResponseBodyInvariantViolation)), 50)
    }
    parseMessage()
  })
  return mockWsServer
}
