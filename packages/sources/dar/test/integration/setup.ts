import { ServerInstance } from '@chainlink/external-adapter-framework'
import {
  PriceAdapter,
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequestBody, AdapterRequestData } from '@chainlink/external-adapter-framework/util'
import { Server, WebSocket } from 'mock-socket'
import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import { priceTransport } from '../../src/endpoint/price'
import { mockPriceResponse } from './fixtures'
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

export const mockPriceWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    setTimeout(() => {
      socket.send(JSON.stringify(mockPriceResponse))
    }, 100)
  })
  return mockWsServer
}

export const createAdapter = () => {
  const priceEndpoint = new PriceEndpoint({
    name: 'price',
    transport: priceTransport,
    inputParameters: new InputParameters(priceEndpointInputParametersDefinition),
  })

  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: 'price',
    endpoints: [priceEndpoint],
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}

export async function getAdapterResponse(
  req: SuperTest<Test>,
  requestData: Record<string, unknown> | AdapterRequestBody<AdapterRequestData>,
): Promise<Test> {
  const makeRequest = () =>
    req
      .post('/')
      .send(requestData)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)

  return await makeRequest()
}
