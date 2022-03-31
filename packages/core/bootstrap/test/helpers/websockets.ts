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
  // Extend mock WebSocket class to bypass protocol headers error
  class MockWebSocket extends WebSocket {
    constructor(url: string, protocol: string | string[] | Record<string, string> | undefined) {
      super(url, protocol instanceof Object ? undefined : protocol)
    }
  }

  // Need to disable typing, the mock-socket impl does not implement the ws interface fully
  provider.set(MockWebSocket as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const mockWebSocketServer = (url: string): Server => {
  return new Server(url, { mock: false })
}

export type WsMessageExchange = {
  request: unknown
  response: unknown
}

export type ParsedWsMessageExchange = WsMessageExchange & {
  expected: string
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
 * @param options options to enforce sequence and error on unexpected messages
 * @returns a promise that resolves when all exchanges have executed
 */
export const mockWebSocketFlow = async (
  server: Server,
  flow: WsMessageExchange[],
  options = {
    enforceSequence: true,
    errorOnUnexpectedMessage: true,
  },
): Promise<boolean> => {
  return new Promise((resolve) => {
    const buildPayload = (msg: unknown) => (typeof msg === 'string' ? msg : JSON.stringify(msg))

    // Parse requests beforehand to avoid stringifying all exchanges on every incoming ws message
    const parsedFlow: ParsedWsMessageExchange[] = flow.map((exchange) => ({
      ...exchange,
      expected: buildPayload(exchange.request),
    }))

    server.on('connection', async (connection) => {
      // Handler to send the response (or responses) back to the client
      const sendResponse = (response: unknown, nested = false) => {
        if (!nested && Array.isArray(response) && response.length > 0) {
          response.forEach((r) => sendResponse(r, true))
        } else {
          connection.send(buildPayload(response))
        }
      }

      connection.on('message', (received) => {
        let exchange

        if (parsedFlow.length === 0 && options.errorOnUnexpectedMessage) {
          throw Error(`Unexpected WS message, received: '${received}'`)
        }

        if (options.enforceSequence) {
          // If the sequence is enforced, get first item from the flow of exchanges
          exchange = parsedFlow[0] as ParsedWsMessageExchange

          if (exchange.expected !== received) {
            if (options.errorOnUnexpectedMessage) {
              throw Error(
                `The WS message received does not match the expected one.
                 Expected: '${exchange.expected}'
                 Received: '${received}'`,
              )
            } else {
              return
            }
          }

          // Message received matches expected request, remove exchange from the list
          parsedFlow.shift()
        } else {
          // If the sequence is not enforced, try to find the received msg within the list of expected exchanges
          const i = parsedFlow.findIndex((exchange) => exchange.expected === received)

          if (i === -1) {
            if (options.errorOnUnexpectedMessage) {
              throw Error(`Unexpected WS message, received: '${received}'`)
            } else {
              return
            }
          }

          // Message received matches expected request, remove exchange from the list
          exchange = parsedFlow.splice(i, 1)[0]
        }

        sendResponse(exchange.response)

        if (parsedFlow.length === 0) {
          resolve(true)
        }
      })
    })
  })
}
