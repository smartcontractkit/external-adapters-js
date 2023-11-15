import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports/websocket'
import { LoggerFactoryProvider, sleep } from '@chainlink/external-adapter-framework/util'

import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import * as forex from '../../src/transport/utils'
import * as forexEndpoint from '../../src/transport/forex-ws'
import {
  ForexRequestParams,
  TraderMadeWebsocketReverseMappingTransport,
} from '../../src/transport/utils'
import { config } from '../../src/transport/forex-ws'
import { adapter } from '../../src'
import testPayload from '../../test-payload.json'

//Since the test is directly using transport functions, we need to initialize the logger here
LoggerFactoryProvider.set()

describe('TraderMadeWebsocketReverseMappingTransport', () => {
  const context = {
    adapterSettings: {
      WS_API_KEY: 'test_key',
    },
    endpointName: 'forex',
    inputParameters: new InputParameters({}),
  } as EndpointContext<forexEndpoint.WsTransportTypes>
  let transport: forex.TraderMadeWebsocketReverseMappingTransport
  let subscriptions: SubscriptionDeltas<ForexRequestParams>
  let connClosed: boolean

  class MockWebSocket {
    onclose?: () => void
    readyState?: number

    close() {
      connClosed = true
      this.readyState = 3 // CLOSED
      if (this.onclose) {
        this.onclose()
      }
    }

    send() {
      return
    }

    addEventListener(event: string, listener: any) {
      if (event === 'open') {
        listener({ type: 'mock_open' })
      }
    }

    removeAllListeners() {
      return
    }
  }

  beforeAll(() => {
    WebSocketClassProvider.set(MockWebSocket)
    process.env.WS_API_KEY = 'test_key'
    metrics.initialize()
  })

  beforeEach(() => {
    transport = new TraderMadeWebsocketReverseMappingTransport(config)
    connClosed = false
  })

  describe('test connection', () => {
    it('first request, establish connection', async () => {
      subscriptions = {
        desired: [{ base: 'GBP', quote: 'USD' }],
        new: [],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)

      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)
      expect(subscriptions['new']).toEqual([{ base: 'GBP', quote: 'USD' }])
      transport.wsConnection.close()
    })
  })

  describe('test closing of connection', () => {
    it('new subscription, closes existing connection and creates a new connection', async () => {
      subscriptions = {
        desired: [{ base: 'GBP', quote: 'USD' }],
        new: [],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [
          { base: 'GBP', quote: 'USD' },
          { base: 'EUR', quote: 'USD' },
        ],
        new: [{ base: 'EUR', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      expect(connClosed).toEqual(true)
      // we close the connection however since we have a new pair ('EUR/USD') we will reconnect again
      expect(transport.connectionClosed()).toEqual(false)
    })

    it('stale connection, closes existing connection', async () => {
      subscriptions = {
        desired: [{ base: 'GBP', quote: 'USD' }],
        new: [],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [],
        new: [],
        stale: [{ base: 'GBP', quote: 'USD' }],
      }

      await transport.streamHandler(context, subscriptions)
      expect(connClosed).toEqual(true)
      expect(transport.connectionClosed()).toEqual(true)
    })
  })
})

describe('test-payload.json', () => {
  it('should contain all endpoints/aliases', () => {
    const endpointsWithAliases = adapter.endpoints.map((e) => [e.name, ...(e.aliases || [])]).flat()
    endpointsWithAliases.forEach((alias) => {
      const requests = testPayload.requests as { endpoint?: string }[]
      const aliasedRequest = requests.find((req) => req?.endpoint === alias)
      expect(aliasedRequest).toBeDefined()
    })
  })
})
