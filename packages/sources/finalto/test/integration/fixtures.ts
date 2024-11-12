import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const parsed = JSON.parse(message as string)
      if (parsed['MsgType'] === 'Logon') {
        return socket.send(
          JSON.stringify({
            MsgType: 'Logon',
          }),
        )
      }
      return socket.send(
        JSON.stringify({
          MsgSeqNum: '12',
          MsgType: 'SymbolPrices',
          Prices: [
            {
              Px: '6.82427',
              Type: 'B',
              Vol: '1000000',
            },
            {
              Px: '6.82543',
              Type: 'O',
              Vol: '1000000',
            },
          ],
          SendTime: '20240111-05:32:40.198',
          SubID: parsed.SubID,
          Symbol: 'GBPUSD',
        }),
      )
    })
  })

  return mockWsServer
}
