import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { Server, WebSocket } from 'mock-socket'
import { customSettings } from '../../src/config'
import { cryptoEndpoint } from '../../src/endpoint/crypto'
import { forexEndpoint } from '../../src/endpoint/forex'
import { loginResponse, mockCryptoResponse, mockForexResponse } from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import includes from '../../src/config/includes.json'

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

export const mockCryptoWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(loginResponse))
    socket.send(JSON.stringify(mockCryptoResponse))
  })
  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(mockForexResponse))
  })
  return mockWsServer
}

export const createAdapter = (): PriceAdapter<typeof customSettings> => {
  return new PriceAdapter({
    name: 'test',
    defaultEndpoint: 'crypto',
    endpoints: [cryptoEndpoint, forexEndpoint],
    includes,
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
