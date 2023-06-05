import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server, WebSocket } from 'mock-socket'
import { AddressInfo } from 'net'
import * as nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { config } from '../../src/config'
import { crypto, forex, stock, ukEtf } from '../../src/endpoint'

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

export const mockStockWebSocketServer = (URL: string): Server => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the U.S Market source.',
    },
    {
      s: 'AAPL',
      p: 163.58,
      c: [37],
      v: 50,
      dp: false,
      t: 1646154954689,
    },
  ]
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      wsResponse.forEach((message) => {
        socket.send(JSON.stringify(message))
      })
    })
  })

  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the Forex Market source.',
    },
    {
      s: 'GBP/USD',
      a: 1.33139,
      b: 1.3313,
      dd: '-0.0108',
      dc: '-0.8082',
      ppms: false,
      t: 1646157588000,
    },
  ]
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      wsResponse.forEach((message) => {
        socket.send(JSON.stringify(message))
      })
    })
  })

  return mockWsServer
}

export const mockCryptoWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            s: 'BTCUSD',
            p: '43682.66306523',
            q: '0.04582000',
            dex: false,
            src: 'A',
            t: 1646151298290,
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}

export const mockEtfWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            s: 'CSPX',
            p: 445.76,
            dc: '0.0000',
            dd: '0.0000',
            t: 1685958155,
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}

export const createAdapter = () => {
  return new Adapter({
    name: 'TEST',
    defaultEndpoint: stock.name,
    endpoints: [stock, forex, crypto, ukEtf],
    config,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
