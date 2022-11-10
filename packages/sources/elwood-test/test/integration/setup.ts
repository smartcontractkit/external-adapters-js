import { SuperTest, Test } from 'supertest'
import { Server, WebSocket } from 'mock-socket'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const mockWebSocketProvider = (provider: typeof WebSocketClassProvider): void => {
  // Extend mock WebSocket class to bypass protocol headers error
  class MockWebSocket extends WebSocket {
    constructor(url: string, protocol: string | string[] | Record<string, string> | undefined) {
      super(url, protocol instanceof Object ? undefined : protocol)
    }
    // Mock WebSocket does not come with built on function which adapter handlers could be using for ws
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on(_: Event) {
      return
    }
  }

  // Need to disable typing, the mock-socket impl does not implement the ws interface fully
  provider.set(MockWebSocket as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      socket.send(
        JSON.stringify({
          type: 'Index',
          data: {
            price: '10000',
            symbol: 'ETH-USD',
            timestamp: '2022-11-08T04:18:18.736534617Z',
          },
          sequence: 123,
        }),
      )
    }
    parseMessage()
  })
  return mockWsServer
}
