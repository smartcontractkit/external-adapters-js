import * as process from 'process'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { endpoint } from '../../src/endpoint/price-router'
import { WsAssetMetricsSuccessResponse } from '../../src/endpoint/price-ws'
import { customSettings } from '../../src/config'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

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

const wsResponseBody: WsAssetMetricsSuccessResponse = {
  cm_sequence_id: 0,
  type: 'price',
  time: Date.now().toString(),
  asset: 'eth',
  height: 9999999,
  hash: 'YWxsIHlvdXIgYmFzZSBhcmU=',
  parent_hash: 'YmVsb25nIHRvIHVzCg==',
  ReferenceRateUSD: 1500,
}

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      socket.send(JSON.stringify(wsResponseBody))
    }
    parseMessage()
  })
  return mockWsServer
}

export const createAdapter = (): Adapter<typeof customSettings> => {
  return new Adapter({
    name: 'test',
    defaultEndpoint: 'price-ws',
    endpoints: [endpoint],
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
