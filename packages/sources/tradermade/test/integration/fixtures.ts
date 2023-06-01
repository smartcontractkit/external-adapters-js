import nock from 'nock'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'

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

/**
 * Sets the mocked websocket instance in the provided provider class.
 * We need this here, because the tests will connect using their instance of WebSocketClassProvider;
 * fetching from this library to the \@chainlink/ea-bootstrap package would access _another_ instance
 * of the same constructor. Although it should be a singleton, dependencies are different so that
 * means that the static classes themselves are also different.
 *
 * @param provider - singleton WebSocketClassProvider
 */
export const mockWebSocketProvider = (provider: typeof WebSocketClassProvider): void => {
  // Extend mock WebSocket class to bypass protocol headers error
  class MockWebSocket extends WebSocket {
    constructor(url: string, protocol: string | string[] | Record<string, string> | undefined) {
      super(url, protocol instanceof Object ? undefined : protocol)
    }
    // This is part of the 'ws' node library but not the common interface, but it's used in our WS transport
    removeAllListeners() {
      for (const eventType in this.listeners) {
        // We have to manually check because the mock-socket library shares this instance, and adds the server listeners to the same obj
        if (!eventType.startsWith('server')) {
          delete this.listeners[eventType]
        }
      }
    }
  }

  // Need to disable typing, the mock-socket impl does not implement the ws interface fully
  provider.set(MockWebSocket as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
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
