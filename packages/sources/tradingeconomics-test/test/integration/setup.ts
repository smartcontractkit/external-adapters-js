import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import * as process from 'process'
import * as nock from 'nock'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Server, WebSocket } from 'mock-socket'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { endpoint as price } from '../../src/endpoint/price-router'
import { endpoint as stock } from '../../src/endpoint/stock-router'
import { config } from '../../src/config'
import includes from '../../src/config/includes.json'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const setupExternalAdapterTest = (
  envVariables: NodeJS.ProcessEnv,
  context: SuiteContext,
  options: TestOptions = { cleanNock: true, fastify: false },
): void => {
  let fastify: ServerInstance

  beforeAll(async () => {
    process.env['METRICS_ENABLED'] = 'false'
    for (const key in envVariables) {
      process.env[key] = envVariables[key]
    }

    if (process.env['RECORD']) {
      nock.recorder.rec()
    }
    fastify = await context.server()

    // eslint-disable-next-line require-atomic-updates
    context.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)

    // Only for edge cases when someone needs to use the fastify instance outside this function
    if (options.fastify) {
      // eslint-disable-next-line require-atomic-updates
      context.fastify = fastify
    }
  })

  afterAll(async () => {
    if (process.env['RECORD']) {
      nock.recorder.play()
    }
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    await fastify.close()
  })
}

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

export const mockWebSocketServer = (url: string) => {
  const mockWsServer = new Server(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_) => {
      socket.send(
        JSON.stringify({
          s: 'USDCAD:CUR',
          i: 'USDCAD',
          pch: 0.26,
          nch: 0.00328,
          bid: 1.28778,
          ask: 1.28778,
          price: 1.28778,
          dt: 1659472542655,
          state: 'open',
          type: 'currency',
          dhigh: 1.2887,
          dlow: 1.2831,
          o: 1.28707,
          prev: 1.2845,
          topic: 'USDCAD',
        }),
      )
    })
  })
  return mockWsServer
}

export const mockStockWebSocketServer = (url: string) => {
  const mockWsServer = new Server(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (_) => {
      socket.send(
        JSON.stringify({
          s: 'AAPL:US',
          price: 160.32,
          dt: 1659472542655,
          topic: 'AAPL:US',
        }),
      )
    })
  })
  return mockWsServer
}

export const createAdapter = () => {
  return new PriceAdapter({
    name: 'TRADINGECONOMICS',
    endpoints: [price, stock],
    defaultEndpoint: price.name,
    config,
    includes,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
