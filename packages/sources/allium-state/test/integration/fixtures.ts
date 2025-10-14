import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const parsedMessage = JSON.parse(message.toString())

      // Handle subscription messages
      if (parsedMessage.type === 'subscribe') {
        const { base, quote } = parsedMessage

        // Define mock prices for different currencies
        const mockPrices: { [key: string]: number } = {
          CBBTC: 45000.5,
          BUSD: 1.0,
        }

        const price = mockPrices[base] || 45000.5

        // Use the mocked date from the test (2022-01-01T11:11:11.111Z)
        const mockTimestamp = '2022-01-01T11:11:11.111Z'

        return socket.send(
          JSON.stringify({
            type: 'aggregated_state_price_update',
            timestamp: mockTimestamp,
            data: {
              base: base,
              quote: quote || 'USD',
              state_price: price,
            },
          }),
        )
      }
    })
  })

  return mockWsServer
}
