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
import { forex } from '../../src/endpoint'

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

export const mockForexWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            symbol: 'ETHUSD',
            ts: '1646073761745',
            bid: 2797.53,
            ask: 2798.14,
            mid: 2797.835,
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
    defaultEndpoint: forex.name,
    endpoints: [forex],
    config,
    includes,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
