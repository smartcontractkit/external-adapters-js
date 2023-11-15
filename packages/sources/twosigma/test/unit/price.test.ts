import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports/websocket'
import { LoggerFactoryProvider, sleep } from '@chainlink/external-adapter-framework/util'

import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import * as price from '../../src/transport/price'
import { RequestParams } from '../../src/endpoint/price'
import { adapter } from '../../src'
import testPayload from '../../test-payload.json'

//Since the test is directly using transport functions, we need to initialize the logger here
LoggerFactoryProvider.set()

const makeParam = (base: string) => {
  return {
    base,
    quote: 'USD',
  }
}

describe('Config', () => {
  describe('url', () => {
    const context = {
      adapterSettings: {
        WS_API_ENDPOINT: 'wss://chainlink.twosigma.com',
      },
      endpointName: 'price',
      inputParameters: new InputParameters({}),
    } as EndpointContext<price.WsTransportTypes>

    it('returns the endpoint URL from the config', () => {
      expect(price.options.url(context)).toEqual(context.adapterSettings.WS_API_ENDPOINT)
    })
  })

  describe('message', () => {
    it('returns empty undefined for invalid messages', () => {
      expect(price.options.handlers.message({} as price.WebSocketMessage)).toEqual(undefined)
      expect(
        price.options.handlers.message({ timestamp: 1672491600 } as price.WebSocketMessage),
      ).toEqual(undefined)
      expect(
        price.options.handlers.message({ symbol_price_dict: {} } as price.WebSocketMessage),
      ).toEqual(undefined)
    })

    it('returns a result for each symbol', () => {
      const message = {
        timestamp: 1672491600,
        symbol_price_dict: {
          'AAPL/USD': {
            quote_currency: 'USD',
            session_status_flag: 'open' as const,
            asset_status_flag: 'active' as const,
            confidence_interval: 0.5,
            price: 100,
          },
          'AMZN/USD': {
            quote_currency: 'USD',
            session_status_flag: 'open' as const,
            asset_status_flag: 'active' as const,
            confidence_interval: 0.6,
            price: 200,
          },
        },
      }

      expect(price.options.handlers.message(message)).toEqual([
        {
          params: {
            base: 'AAPL',
            quote: 'USD',
          },
          response: {
            result: 100,
            data: {
              result: 100,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: 1672491600000,
            },
          },
        },
        {
          params: {
            base: 'AMZN',
            quote: 'USD',
          },
          response: {
            result: 200,
            data: {
              result: 200,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: 1672491600000,
            },
          },
        },
      ])
    })
  })
})

describe('TwoSigmaWebsocketTransport', () => {
  const context = {
    adapterSettings: {
      WS_API_ENDPOINT: 'wss://chainlink.twosigma.com',
      WS_API_KEY: 'abc',
    },
    endpointName: 'price',
    inputParameters: new InputParameters({}),
  } as any as EndpointContext<price.WsTransportTypes>
  let transport: price.TwoSigmaWebsocketTransport
  let subscriptions: SubscriptionDeltas<RequestParams>
  let connClosed: boolean
  let sentMessages: string[]

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

    send(message: string) {
      sentMessages.push(message)
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
    process.env.WS_API_KEY = 'abc'
    metrics.initialize()
  })

  beforeEach(() => {
    transport = new price.TwoSigmaWebsocketTransport(price.options)
    subscriptions = {
      desired: [makeParam('AAPL'), makeParam('AMZN')],
      new: [makeParam('AMZN')],
      stale: [makeParam('V')],
    }
    connClosed = false
    sentMessages = []
  })

  describe('streamHandler', () => {
    it('closes the ws connection', async () => {
      await transport.streamHandler(context, subscriptions)
      await sleep(100)
      expect(connClosed).toEqual(false)
      expect(transport.connectionClosed()).toEqual(false)

      // An empty desired set means that the framework won't open a new connection.
      subscriptions = {
        desired: [],
        new: [],
        stale: [makeParam('AAPL'), makeParam('AMZN')],
      }

      await transport.streamHandler(context, subscriptions)
      expect(connClosed).toEqual(true)
      expect(transport.connectionClosed()).toEqual(true)
    })

    it('sends a message to subscribe', async () => {
      await transport.streamHandler(context, subscriptions)
      await sleep(200)
      expect(sentMessages).toHaveLength(1)
      expect(JSON.parse(sentMessages[0])).toEqual({
        api_key: 'abc',
        symbols: ['AAPL/USD', 'AMZN/USD'],
      })

      subscriptions = {
        desired: [makeParam('AAPL'), makeParam('AMZN'), makeParam('V')],
        new: [makeParam('V')],
        stale: [],
      }

      await transport.streamHandler(context, subscriptions)
      await sleep(200)
      expect(sentMessages).toHaveLength(2)
      expect(JSON.parse(sentMessages[1])).toEqual({
        api_key: 'abc',
        symbols: ['AAPL/USD', 'AMZN/USD', 'V/USD'],
      })
    })
  })
})

describe('parseBaseQuote', () => {
  const symbol = 'AAPL/USD'
  const params = {
    base: 'AAPL',
    quote: 'USD',
  }

  it('parses the symbol', () => {
    expect(price.parseBaseQuote(symbol)).toEqual(params)
  })

  it('returns undefined for invalid symbols', () => {
    expect(price.parseBaseQuote('')).toEqual(undefined)
    expect(price.parseBaseQuote('AAPL')).toEqual(undefined)
    expect(price.parseBaseQuote('AAPL//USD')).toEqual(undefined)
    expect(price.parseBaseQuote('AAPL/USD/USD')).toEqual(undefined)
  })
})

describe('buildSymbol', () => {
  const symbol = 'AAPL/USD'
  const params = {
    base: 'AAPL',
    quote: 'USD',
  }

  it('builds the symbol ticker', () => {
    expect(price.buildSymbol(params)).toEqual(symbol)
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
