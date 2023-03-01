import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import * as process from 'process'
import * as nock from 'nock'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../src/config'
import { crypto, forex, iex } from '../../src/endpoint'
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
  const wsResponse = {
    service: 'crypto_data',
    messageType: 'A',
    data: ['SA', 'eth/usd', '2022-03-02T19:37:08.102119+00:00', 'tiingo', 2930.4483973989],
  }
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(wsResponse))
  })

  return mockWsServer
}

export const mockIexWebSocketServer = (URL: string): Server => {
  const wsResponse = {
    messageType: 'A',
    service: 'iex',
    data: [
      'Q',
      '2022-02-16T12:35:16.595244526-05:00',
      1645032916595244500,
      'aapl',
      399,
      170.28,
      170.285,
      170.29,
      100,
      null,
      null,
      0,
      0,
      null,
      null,
      null,
    ],
  }
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.send(JSON.stringify(wsResponse))
  })

  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            messageType: 'A',
            service: 'fx',
            data: [
              'Q',
              'eurusd',
              '2022-04-14T19:33:12.474000+00:00',
              1000000,
              1.08267,
              1.08272,
              1000000,
              1.08277,
            ],
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}

export const createAdapter = (): PriceAdapter<typeof customSettings> => {
  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: crypto.name,
    endpoints: [crypto, forex, iex],
    customSettings,
    includes,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
