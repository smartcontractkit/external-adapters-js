import { AddressInfo } from 'net'
import * as process from 'process'

import { ServerInstance } from '@chainlink/external-adapter-framework'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { sleep } from '@chainlink/external-adapter-framework/util'
import { Server, WebSocket } from 'mock-socket'
import request, { SuperTest, Test } from 'supertest'

import { server } from '../../src'
import { WebSocketMessage, WebSocketRequest } from '../../src/endpoint/price'

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

describe('websocket', () => {
  const oldEnv = { ...process.env }
  const webSocketEndpoint = 'ws://localhost:9090'
  const webSocketApiKey = 'abcdef'

  let spy: jest.SpyInstance
  let mockWebSockerServer: Server
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  const makeRequest = (base: string) =>
    req
      .post('/')
      .send({ data: { base, quote: 'USD' } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)

  jest.setTimeout(10000)

  beforeAll(async () => {
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_ENDPOINT'] = webSocketEndpoint
    process.env['WS_API_KEY'] = webSocketApiKey

    const mockDate = new Date('2023-01-01T00:00:00Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Initialize adapter before mocking websocket provider
    fastify = await server()
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    mockWebSocketProvider(WebSocketClassProvider)
    mockWebSockerServer = new Server(webSocketEndpoint, { mock: false })
    mockWebSockerServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        const payload: WebSocketRequest = JSON.parse(message as string)
        expect(payload.api_key).toEqual(webSocketApiKey)

        const symbolPriceDict: WebSocketMessage['symbol_price_dict'] = {}
        payload.symbols.forEach((symbol, i) => {
          symbolPriceDict[symbol] = {
            quote_currency: 'USD',
            session_status_flag: 'open',
            asset_status_flag: 'active',
            confidence_interval: (i + 1) * 0.1,
            price: (i + 1) * 100,
          }
        })

        socket.send(
          JSON.stringify({
            timestamp: 1645203822,
            symbol_price_dict: symbolPriceDict,
          }),
        )
      })
    })

    // Send initial request to start background execute
    await makeRequest('AAPL')
    await sleep(5000)
  })

  afterAll(async () => {
    spy.mockRestore()
    for (const key in oldEnv) {
      process.env[key] = oldEnv[key]
    }
    await fastify?.close()
    mockWebSockerServer.close()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const resp1 = await makeRequest('AAPL')
      expect(resp1.body).toEqual({
        result: 100,
        data: {
          result: 100,
        },
        timestamps: {
          providerDataReceivedUnixMs: 1672531200000, // mocked time
          providerDataStreamEstablishedUnixMs: 1672531200000,
          providerIndicatedTimeUnixMs: 1645203822000, // response.timestamp
        },
        statusCode: 200,
      })

      await makeRequest('AMZN')
      await sleep(5000) // Wait for next background executor loop

      const resp2 = await makeRequest('AAPL')
      expect(resp2.body).toEqual({
        result: 100,
        data: {
          result: 100,
        },
        timestamps: {
          providerDataReceivedUnixMs: 1672531200000,
          providerDataStreamEstablishedUnixMs: 1672531200000,
          providerIndicatedTimeUnixMs: 1645203822000,
        },
        statusCode: 200,
      })
      const resp3 = await makeRequest('AMZN')
      expect(resp3.body).toEqual({
        result: 200,
        data: {
          result: 200,
        },
        timestamps: {
          providerDataReceivedUnixMs: 1672531200000,
          providerDataStreamEstablishedUnixMs: 1672531200000,
          providerIndicatedTimeUnixMs: 1645203822000,
        },
        statusCode: 200,
      })
    }, 30000)
  })
})
