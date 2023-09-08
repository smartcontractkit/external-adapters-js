import nock from 'nock'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports/websocket'
import { LoggerFactoryProvider, sleep } from '@chainlink/external-adapter-framework/util'

import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import * as price from '../../src/transport/price'
import { RequestParams } from '../../src/endpoint/price'

//Since the test is directly using transport functions, we need to initialize the logger here
LoggerFactoryProvider.set()

const desiredSubs = [
  {
    base: 'ETH',
    quote: 'USD',
  },
]

export const mockTokenResponse = (): nock.Scope =>
  nock('https://dar-test.com', {
    encodedQueryParams: true,
  })
    .post('/token-auth')
    .reply(
      200,
      () => ({
        access_token: '111111111111111111111111111',
        expires_in: 12345,
        token_type: 'test_key',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

describe('Config', () => {
  const context = {
    adapterSettings: {
      WS_API_ENDPOINT: 'wss://dar--ws-test.com',
    },
    endpointName: 'price',
    inputParameters: new InputParameters({}),
  } as EndpointContext<price.WsTransportTypes>

  describe('url', () => {
    it('returns the endpoint URL from the config', () => {
      expect(price.config.url(context, desiredSubs)).toEqual(
        context.adapterSettings.WS_API_ENDPOINT,
      )
    })
  })

  describe('message', () => {
    it('returns a result for each symbol', () => {
      const message = {
        priceIdentifier: 'eth-USD-10-1694168714.4',
        methodologyCode: 'DARSTD400msVW',
        darAssetID: 'DASK8KY',
        darAssetTicker: 'eth',
        quoteCurrency: 'USD',
        price: 1621.891790669695,
        priceTier: 2,
        volumes: { verifiable: 7599.211796003789, estimatedReal: '' },
        windowStart: '2023-09-08T10:25:14+00:00',
        indowEnd: '2023-09-08T10:25:14+00:00',
        holdover: true,
        principalMarketPrice: null,
        errors: '',
        publishedAt: '2023-09-08T10:26:07.915375Z',
        receivedAt: '2023-09-08T10:26:07+00:00',
        effectiveTime: 1694168714.4,
      }

      expect(price.config.handlers.message(message, context)).toEqual([
        {
          params: { base: 'eth', quote: 'USD' },
          response: {
            result: 1621.891790669695,
            data: {
              result: 1621.891790669695,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: 1694168714400,
            },
          },
        },
      ])
    })
  })
})

describe('DarWebsocketTransport', () => {
  const context = {
    adapterSettings: {
      API_ENDPOINT: 'https://dar-test.com',
      WS_API_ENDPOINT: 'wss://dar-ws-test.com',
      WS_API_KEY: 'test_key',
    },
    endpointName: 'price',
    inputParameters: new InputParameters({}),
  } as EndpointContext<price.WsTransportTypes>
  let transport: price.DarWebsocketTransport
  let subscriptions: SubscriptionDeltas<RequestParams>
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
    mockTokenResponse()
    metrics.initialize()
  })

  beforeEach(() => {
    transport = new price.DarWebsocketTransport(price.config)
    connClosed = false
  })

  describe('test connection', () => {
    it('first request, establish connection', async () => {
      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [{ base: 'BTC', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      // check subscriptions
      console.log(transport.localSubscriptions)
      transport.wsConnection.close()
    })
  })

  describe('test closing of connection', () => {
    it('new subscription, closes existing connection', async () => {
      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [{ base: 'BTC', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [],
        new: [{ base: 'ETH', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      expect(connClosed).toEqual(true)
      expect(transport.connectionClosed()).toEqual(true)
    })

    it('stale connection, closes existing connection', async () => {
      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [{ base: 'BTC', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [],
        new: [],
        stale: [{ base: 'ETH', quote: 'USD' }],
      }

      await transport.streamHandler(context, subscriptions)
      expect(connClosed).toEqual(true)
      expect(transport.connectionClosed()).toEqual(true)
    })
  })

  describe('test opening of connection', () => {
    it('new subscription opens a new connection', async () => {
      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [{ base: 'BTC', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [
          { base: 'BTC', quote: 'USD' },
          { base: 'ETH', quote: 'USD' },
        ],
        new: [{ base: 'ETH', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(transport.connectionClosed()).toEqual(false)
    })

    it('stale connection, opens a new connection', async () => {
      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [{ base: 'BTC', quote: 'USD' }],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      subscriptions = {
        desired: [{ base: 'BTC', quote: 'USD' }],
        new: [],
        stale: [{ base: 'ETH', quote: 'USD' }],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(transport.connectionClosed()).toEqual(false)
    })
  })
})
