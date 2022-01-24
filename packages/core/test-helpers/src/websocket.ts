import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/src/lib/ws/recorder'
import { Client, Server, WebSocket } from 'mock-socket'

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

export const mockMessageResponse = (
  exchange: WsMessageExchange,
  client: Client,
): Promise<boolean> => {
  const { request, response } = exchange
  return new Promise((resolve) => {
    client.on('message', (received) => {
      if (received === JSON.stringify(request)) {
        if (Array.isArray(response) && response.length > 0) {
          response.forEach((r) => client.send(JSON.stringify(r)))
        } else {
          client.send(JSON.stringify(response))
        }
        resolve(true)
      }
    })
  })
}

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
): Promise<void> => {
  return new Promise((resolve) => {
    server.on('connection', async (connection) => {
      const exchangesFulfilled = flow.map((exchange) => mockMessageResponse(exchange, connection))
      await Promise.all(exchangesFulfilled)
      resolve()
    })
  })
}
