import { ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { AddressInfo } from 'net'
import * as nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import includes from '../../src/config/includes.json'
import { crypto, cryptolwba, forex, iex } from '../../src/endpoint'

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
        // We have to manually check because the mock-socket library shares this instance,
        // and adds the server listeners to the same obj
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
  const wsResponse = {
    service: 'crypto_data',
    messageType: 'A',
    data: ['SA', 'eth/usd', '2022-03-02T19:37:08.102119+00:00', 'tiingo', 2930.4483973989],
  }
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(wsResponse))
    })
  })

  return mockWsServer
}

export const mockCryptoLwbaWebSocketServer = (URL: string): Server => {
  const wsResponse = {
    service: 'crypto_data',
    messageType: 'A',
    data: [
      'SA',
      'eth/usd',
      '2023-03-30T14:38:14.577256+00:00',
      'tiingo',
      1793.915292654675,
      0.00032445356984135313,
      117.75114002,
      1793.6242715443277,
      126.22352905999999,
      1794.2063137650225,
    ],
  }
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(wsResponse))
    })
  })

  return mockWsServer
}

export const mockIexWebSocketServer = (URL: string): Server => {
  const wsResponseQ = {
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
  const wsResponseT = {
    messageType: 'A',
    service: 'iex',
    data: [
      'T',
      '2022-02-16T12:35:16.595244526-05:00',
      1645032916595244500,
      'amzn',
      null,
      null,
      null,
      null,
      null,
      106.21,
      null,
      null,
      0,
      0,
      0,
      0,
    ],
  }
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(JSON.stringify(wsResponseQ))
      socket.send(JSON.stringify(wsResponseT))
    })
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

export const createAdapter = () => {
  return new PriceAdapter({
    name: 'TEST',
    defaultEndpoint: crypto.name,
    endpoints: [crypto, forex, iex, cryptolwba],
    config,
    includes,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
