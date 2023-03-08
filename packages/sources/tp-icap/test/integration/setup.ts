import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { Server, WebSocket } from 'mock-socket'
import { customSettings } from '../../src/config'
import { transport } from '../../src/endpoint/price'
import { mockPriceResponse, mockStalePriceResponse, mockSubscribeResponse } from './fixtures'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  PriceAdapter,
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { ServerInstance } from '@chainlink/external-adapter-framework'

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

export const mockPriceWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    setTimeout(() => {
      socket.send(JSON.stringify(mockSubscribeResponse))
      socket.send(JSON.stringify(mockStalePriceResponse))
      socket.send(JSON.stringify(mockPriceResponse))
    }, 100)
  })
  return mockWsServer
}

export const createAdapter = (): PriceAdapter<typeof customSettings> => {
  const priceEndpoint = new PriceEndpoint({
    name: 'price',
    aliases: ['crypto'],
    transport,
    inputParameters: priceEndpointInputParameters,
  })

  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: 'price',
    endpoints: [priceEndpoint as PriceEndpoint<any>],
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
