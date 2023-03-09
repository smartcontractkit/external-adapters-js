import * as process from 'process'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { priceRouter, lwbaRouter } from '../../src/endpoint'
import { WsAssetMetricsSuccessResponse } from '../../src/endpoint/price-ws'
import { customSettings } from '../../src/config'
import { WsCryptoLwbaSuccessResponse } from '../../src/endpoint/lwba-ws'

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
  time: '2020-06-08T20:54:04.000000000Z',
  asset: 'eth',
  height: 9999999,
  hash: 'YWxsIHlvdXIgYmFzZSBhcmU=',
  parent_hash: 'YmVsb25nIHRvIHVzCg==',
  ReferenceRateUSD: '1500',
}

const wsSpreadResponseBody: WsCryptoLwbaSuccessResponse = {
  pair: 'eth-usd',
  time: '2023-03-08T04:04:33.750000000Z',
  ask_price: '1562.4083581615457',
  ask_size: '31.63132041',
  bid_price: '1562.3384315992228',
  bid_size: '64.67517577',
  mid_price: '1562.3733948803842',
  spread: '0.000044756626394287605',
  cm_sequence_id: '282',
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

export const mockSpreadWebSocketServer = (URL: string) => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsSpreadResponseBody)), 10)
    }
    parseMessage()
  })
  return mockWsServer
}

export const createAdapter = (): Adapter<typeof customSettings> => {
  return new Adapter({
    name: 'TEST',
    defaultEndpoint: 'price-ws',
    endpoints: [priceRouter, lwbaRouter],
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
