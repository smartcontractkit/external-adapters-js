import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://www.cfbenchmarks.com/api')
    .get('/v1/values?id=BRTI')
    .reply(200, {
      serverTime: '2022-02-18T16:53:55.772Z',
      payload: [
        { value: '39829.42', time: 1645199636000 },
        { value: '39829.30', time: 1645199637000 },
      ],
    })
    .persist()

export const mockBircResponseSuccess = (): nock.Scope => {
  const currentDayIsoString = new Date().toISOString()
  const currentDayTimestampMs = new Date(currentDayIsoString).getTime()
  return nock('https://www.cfbenchmarks.com/api')
    .get('/v1/curves?id=BIRC')
    .reply(200, {
      serverTime: '2023-02-24T08:17:17.446Z',
      payload: [
        {
          tenors: {
            SIRB: '0.0986',
            '1W': '0.0077',
            '2W': '0.0186',
            '3W': '0.0219',
            '1M': '0.0168',
            '2M': '0.0099',
            '3M': '0.0097',
            '4M': '0.0078',
            '5M': '0.0059',
          },
          time: currentDayTimestampMs,
        },
        {
          tenors: {
            SIRB: '0.0947',
            '1W': '0.0367',
            '2W': '0.0185',
            '3W': '0.0229',
            '1M': '0.0274',
            '2M': '0.0297',
            '3M': '0.0275',
            '4M': '0.0253',
            '5M': '0.0000',
          },
          time: currentDayTimestampMs,
        },
      ],
    })
    .persist()
}

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
