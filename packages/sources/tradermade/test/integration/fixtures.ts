import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockForexResponse = (): nock.Scope =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'ETHUSD' })
    .reply(
      200,
      () => {
        return {
          endpoint: 'live',
          quotes: [
            {
              ask: 4494.03,
              base_currency: 'ETH',
              bid: 4494.02,
              mid: 4494.0249,
              quote_currency: 'USD',
            },
          ],
          requested_time: 'Fri, 05 Nov 2021 17:11:25 GMT',
          timestamp: 1636132286,
        }
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'AAPL' })
    .reply(
      200,
      () => {
        return {
          endpoint: 'live',
          quotes: [
            {
              ask: 128.79,
              bid: 128.78,
              mid: 128.785,
              instrument: 'AAPL',
            },
          ],
          requested_time: 'Fri, 05 Nov 2021 17:11:25 GMT',
          timestamp: 1636132286,
        }
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'OILUSD' })
    .reply(
      200,
      () => {
        return {
          endpoint: 'live',
          quotes: [
            {
              ask: 71.292,
              bid: 71.27,
              instrument: 'OILUSD',
              mid: 71.281,
            },
          ],
          requested_time: 'Fri, 05 May 2023 21:56:43 GMT',
          timestamp: 1683323804,
        }
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockForexWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            symbol: 'ETHUSD',
            ts: '1646073761745',
            bid: 2797.53,
            ask: 2798.14,
            mid: 2797.835,
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}
