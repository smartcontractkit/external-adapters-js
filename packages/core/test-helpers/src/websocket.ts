import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/src/lib/middleware/ws/recorder'
import { Server, WebSocket } from 'mock-socket'

/**
 * Sets the mocked websocket instance in the provided provider class.
 * We need this here, because the tests will connect using their instance of WebSocketClassProvider;
 * fetching from this library to the @chainlink/ea-bootstrap package would access _another_ instance
 * of the same constructor. Although it should be a singleton, dependencies are different so that
 * means that the static classes themselves are also different.
 *
 * @param provider singleton WebSocketClassProvider
 */
export const mockWebSocketProvider = (provider: typeof WebSocketClassProvider): void => {
  // Need to disable typing, the mock-socket impl does not implement the ws interface fully
  provider.set(WebSocket as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const mockWebSocketServer = (url: string): Server => {
  return new Server(url, { mock: false })
}

export type WsMessageExchange = {
  request: unknown
  response: unknown
}

// Export this here so adapter packages don't have to add the mock library themselves.
// Note: Types aren't working properly, due to the object-like export in this package's index
export const MockWsServer = Server

/**
 * This function will add listeners for messages on the mocked server, checking if they match one
 * of the expected messages and replying with the provided responses. It does not enforce the sequence
 * provided, only that all exchanges happen at some point.
 *
 * @param server the mocked WS server
 * @param flow an array of message exchanges
 * @returns a promise that resolves when all exchanges have executed
 */
export const mockWebSocketFlow = async (
  server: Server,
  flow: WsMessageExchange[],
): Promise<boolean> => {
  return new Promise((resolve) => {
    let currentExchange = 0
    server.on('connection', async (connection) => {
      connection.on('message', (received) => {
        const { request, response } = flow[currentExchange]
        let expected
        if (typeof request === 'string') {
          expected = request
        } else {
          expected = JSON.stringify(request)
        }

        if (received === expected) {
          if (Array.isArray(response) && response.length > 0) {
            response.forEach((r) => {
              if (typeof r === 'string') {
                return connection.send(r)
              }
              return connection.send(JSON.stringify(r))
            })
          } else if (typeof response === 'string') {
            connection.send(response)
          } else {
            connection.send(JSON.stringify(response))
          }

          currentExchange++
          if (currentExchange === flow.length) {
            resolve(true)
          }
        } else {
          throw Error(
            `The WS message received does not match the expected one. \nExpected: ${expected}\nReceived${received}`,
          )
        }
      })
    })
  })
}
