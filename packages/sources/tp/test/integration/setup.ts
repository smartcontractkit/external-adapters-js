import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { Server, WebSocket } from 'mock-socket'
import {
  mockUSDCADResponse,
  mockTPPriceResponse,
  mockInversePriceResponse,
  mockPriceResponse,
  mockStalePriceResponse,
  mockSubscribeResponse,
  mockSeparateSourcePriceResponse,
} from './icap_fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from '../../src/endpoint'
import { ServerInstance } from '@chainlink/external-adapter-framework'

import { config } from '../../src/config'
import includes from '../../src/config/includes.json'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

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

export const mockPriceWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(mockSubscribeResponse))
    socket.on('message', () => {
      socket.send(JSON.stringify(mockStalePriceResponse))
      socket.send(JSON.stringify(mockUSDCADResponse))
      socket.send(JSON.stringify(mockPriceResponse))
      socket.send(JSON.stringify(mockInversePriceResponse))
      socket.send(JSON.stringify(mockTPPriceResponse))
      socket.send(JSON.stringify(mockSeparateSourcePriceResponse))
    })
  })
  return mockWsServer
}

export const createAdapter = () => {
  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: 'price',
    endpoints: [priceEndpoint],
    config: config,
    includes: includes,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
