import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import { endpoint } from '../../src/endpoint/price-router'
import { WsAssetMetricsSuccessResponse } from '../../src/endpoint/price-ws'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

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

const wsResponseBody: WsAssetMetricsSuccessResponse = {
  cm_sequence_id: 0,
  type: 'price',
  time: '2020-06-08T20:54:04.000000000Z',
  asset: 'eth',
  height: 9999999,
  hash: 'YWxsIHlvdXIgYmFzZSBhcmU=',
  parent_hash: 'YmVsb25nIHRvIHVzCg==',
  ReferenceRateUSD: '1500',
}

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsResponseBody)), 10)
    }
    parseMessage()
  })
  return mockWsServer
}

export const createAdapter = () => {
  return new Adapter({
    name: 'TEST',
    defaultEndpoint: 'price-ws',
    endpoints: [endpoint],
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
