import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      socket.send(
        JSON.stringify({
          op: 'subscribe',
          ret_msg: '',
          success: true,
        }),
      )
      socket.send(
        JSON.stringify({
          topic: 'price',
          data: [
            {
              symbol: 'GMCI30',
              price: 183.7141917913536,
              last_updated: '2025-07-13T08:07:52.746817Z',
            },
          ],
        }),
      )
      socket.send(
        JSON.stringify({
          topic: 'rebalance_status',
          data: [
            {
              symbol: 'GMCI30',
              status: 'rebalanced',
              start_time: '2025-07-25T15:30:00Z',
              end_time: '2025-07-25T16:30:00Z',
            },
          ],
        }),
      )
    })
  })

  return mockWsServer
}
