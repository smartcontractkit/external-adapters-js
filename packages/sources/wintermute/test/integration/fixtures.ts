import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
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
            {
              symbol: 'GML2',
              price: 33.39,
              last_updated: '2025-07-13T08:07:52.746817Z',
            },
          ],
        }),
      )
    })
  })

  return mockWsServer
}
