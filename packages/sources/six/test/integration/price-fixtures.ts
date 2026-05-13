import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockSixPriceWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })

  const streams = JSON.stringify({
    data: {
      startStream: [
        {
          type: 'UPDATE',
          streamId: `happy_market`,
          last: { value: 100.25, unixTimestamp: 1.5 },
          bestBid: { value: 100, size: 10, unixTimestamp: 1 },
          bestAsk: { value: 100.5, size: 5, unixTimestamp: 2 },
        },
        // Ignored by type
        {
          type: 'CANCEL',
          streamId: `happy_market`,
          last: { value: 999, unixTimestamp: 999 },
          bestBid: { value: 999, size: 999, unixTimestamp: 999 },
          bestAsk: { value: 999, size: 999, unixTimestamp: 999 },
        },
        // Ignored by missing value
        {
          type: 'UPDATE',
          streamId: `happy_market`,
          last: { unixTimestamp: 999 },
          bestBid: { value: 999, unixTimestamp: 999 },
          bestAsk: { size: 999, unixTimestamp: 999 },
        },
        {
          type: 'UPDATE',
          streamId: `last_only`,
          last: { value: 1, unixTimestamp: 2 },
        },
        {
          type: 'UPDATE',
          streamId: `bidask_only`,
          bestBid: { value: 1, size: 2, unixTimestamp: 3 },
          bestAsk: { value: 4, size: 5, unixTimestamp: 6 },
        },
        // Ignored by invalid stream id
        {
          type: 'UPDATE',
          streamId: `lol`,
          last: { value: 100.25, unixTimestamp: 1.5 },
        },
        {
          type: 'UPDATE',
          streamId: `bid_update`,
          bestBid: { value: 10, size: 12, unixTimestamp: 12 },
          bestAsk: { value: 13, size: 14, unixTimestamp: 15 },
        },
        {
          type: 'UPDATE',
          streamId: `bid_update`,
          bestBid: { value: 100, size: 120, unixTimestamp: 120 },
          bestAsk: { value: 13, size: 14, unixTimestamp: 15 },
        },
      ],
    },
  })

  const error = JSON.stringify({
    errors: [
      {
        message: 'Error',
        messageCode: 100,
        category: 'Erro category 1',
        type: 'error',
      },
    ],
  })

  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      if (message.toString().includes('error_market')) {
        socket.send(error)
      } else {
        socket.send(streams)
      }
    })
  })
  return mockWsServer
}
