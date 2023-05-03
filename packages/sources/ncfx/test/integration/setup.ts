import { ServerInstance } from '@chainlink/external-adapter-framework'
import {
  CryptoPriceEndpoint,
  PriceAdapter,
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import includes from '../../src/config/includes.json'
import { cryptoTransport, EndpointTypes } from '../../src/endpoint/crypto'
import {
  customInputValidation,
  EndpointTypes as ForexEndpointTypes,
  forexTransport,
} from '../../src/endpoint/forex'
import { loginResponse, mockCryptoResponse, mockForexResponse, subscribeResponse } from './fixtures'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

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

export const mockCryptoWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(loginResponse))
    socket.on('message', () => {
      socket.send(JSON.stringify(subscribeResponse))
      socket.send(JSON.stringify(mockCryptoResponse))
    })
  })
  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(mockForexResponse))
    })
  })
  return mockWsServer
}

export const createAdapter = () => {
  const crypto = new CryptoPriceEndpoint<EndpointTypes>({
    name: 'crypto',
    transport: cryptoTransport,
    inputParameters: new InputParameters(priceEndpointInputParametersDefinition),
  })
  const forex = new PriceEndpoint<ForexEndpointTypes>({
    name: 'forex',
    transport: forexTransport,
    inputParameters: new InputParameters(priceEndpointInputParametersDefinition),
    customInputValidation,
  })
  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: 'crypto',
    endpoints: [crypto, forex],
    includes,
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
