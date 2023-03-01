import * as process from 'process'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { CryptoPriceEndpoint, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { endpoint } from '../../src/endpoint/crypto-router'
import { customSettings } from '../../src/config'

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

const base = 'ETH'
const quote = 'BTC'
const price = 1234

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      socket.send(
        JSON.stringify({
          TYPE: '5',
          FROMSYMBOL: base,
          TOSYMBOL: quote,
          PRICE: price,
        }),
      )
    }
    parseMessage()
  })
  return mockWsServer
}

export const createAdapter = (): PriceAdapter<typeof customSettings> => {
  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: 'crypto',
    endpoints: [endpoint as CryptoPriceEndpoint<any>],
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
