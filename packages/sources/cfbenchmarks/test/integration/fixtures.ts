import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const parsed = JSON.parse(message as string)
      if (parsed.id === 'BRTI') {
        // crypto endpoint
        return socket.send(
          JSON.stringify({
            type: 'value',
            time: 1645203822000,
            id: 'BRTI',
            value: '40067.00',
          }),
        )
      } else if (parsed.id === 'U_ETHUSD_RTI') {
        // lwba endpoint
        return socket.send(
          JSON.stringify({
            type: 'rti_stats',
            time: 1677876163000,
            id: 'U_ETHUSD_RTI',
            value: '1.1635',
            utilizedDepth: '1888000.0',
            valueAsk: '1.1662',
            valueBid: '1.1607',
            midPrice: '1.1631',
          }),
        )
      } else if (parsed.id === 'U_BTCUSD_RTI') {
        // lwba endpoint invariant violation
        console.log('return second eth request')
        return socket.send(
          JSON.stringify({
            type: 'rti_stats',
            time: 1677876163000,
            id: 'U_BTCUSD_RTI',
            value: '1.1635',
            utilizedDepth: '1888000.0',
            valueAsk: '1.125',
            midPrice: '1.126',
            valueBid: '1.123',
          }),
        )
      } else if (parsed.id === 'U_LINKUSD_CHA_RTI') {
        // lwba endpoint
        return socket.send(
          JSON.stringify({
            type: 'rti_stats',
            time: 1677876163000,
            id: 'U_LINKUSD_CHA_RTI',
            value: '2651.63',
            utilizedDepth: '1888000.0',
            valueAsk: '2652.26',
            valueBid: '2651.01',
            midPrice: '2651.63',
          }),
        )
      }
    })
  })

  return mockWsServer
}
