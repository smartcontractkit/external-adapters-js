import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  GmciWebsocketTransport,
  options,
  PriceMessage,
  RebalanceMessage,
  WsResponse,
  WsTransportTypes,
} from '../../src/transport/price'
import { convertTimetoUnixMs } from '../../src/transport/util'

// Initialize logger to avoid errors during test
LoggerFactoryProvider.set()

describe('convertTimetoUnixMs', () => {
  it('converts ISO date string to UNIX ms', () => {
    const input = '2025-07-14T12:00:00Z'
    const expected = 1752494400000
    expect(convertTimetoUnixMs(input)).toBe(expected)
  })

  it('returns NaN for invalid date string', () => {
    expect(convertTimetoUnixMs('invalid')).toBeNaN()
  })
})

describe('builders.subscribeMessage', () => {
  const builders = options.builders!
  const context = {} as EndpointContext<WsTransportTypes>

  it('builds correct subscribe message for a symbol', () => {
    const message = builders.subscribeMessage!({ index: 'GMCI30' }, context) as any
    expect(message.op).toBe('subscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args).toContain('rebalance_status.gmci30')
    expect(message.args.length).toBe(2)
  })
})

describe('builders.unsubscribeMessage', () => {
  const builders = options.builders!
  const context = {} as EndpointContext<WsTransportTypes>

  it('builds correct unsubscribe message for a symbol', () => {
    const message = builders.unsubscribeMessage!({ index: 'GMCI30' }, context) as any
    expect(message.op).toBe('unsubscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args).toContain('rebalance_status.gmci30')
    expect(message.args.length).toBe(2)
  })
})

describe('GmciWebsocketTransport', () => {
  let transport: GmciWebsocketTransport

  const mockWrite = jest.fn()
  const now = Date.now()

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    transport = new GmciWebsocketTransport({} as any)

    // Mock the responseCache
    transport.responseCache = {
      write: mockWrite,
    } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('processes price and rebalance messages and writes combined result to cache', async () => {
    const priceMsg: PriceMessage = {
      symbol: 'GMCI30',
      last_updated: '2025-07-14T12:00:00Z',
      price: 184,
    }

    const rebalanceMsg: RebalanceMessage = {
      symbol: 'GMCI30',
      start_time: '2025-07-14T12:00:00Z',
      end_time: '2025-07-14T13:00:00Z',
      status: 'open',
    }

    transport.price_cache.set(
      'GMCI30',
      {
        params: { index: 'GMCI30', type: 'price' },
        response: {
          result: 184,
          data: {
            result: 184,
            symbol: 'GMCI30',
          },
          timestamps: {
            providerIndicatedTimeUnixMs: 1752494400000,
          },
        },
      },
      90000,
    )

    transport.rebalance_status_cache.set(
      'GMCI30',
      {
        params: { index: 'GMCI30', type: 'rebalance_status' },
        response: {
          data: {
            symbol: 'GMCI30',
            status: 'open',
            start_time: '2025-07-14T12:00:00Z',
            end_time: '2025-07-14T13:00:00Z',
          },
        },
      },
      90000,
    )

    const priceWsMessage: WsResponse = {
      success: true,
      topic: 'price',
      data: [priceMsg],
    }

    const rebalanceWsMessage: WsResponse = {
      success: true,
      topic: 'rebalance_status',
      data: [rebalanceMsg],
    }

    await transport.processMessage(transport, priceWsMessage)
    await transport.processMessage(transport, rebalanceWsMessage)

    expect(mockWrite).toHaveBeenCalledTimes(2)
    const [callArg] = mockWrite.mock.calls[0]
    expect(callArg).toBe(transport.name)

    const [result] = mockWrite.mock.calls[0][1]
    expect(result.params.index).toBe('GMCI30')
    expect(result.response.data.symbol).toBe('GMCI30')
    expect(result.response.data.status).toBe('open')
    expect(result.response.data.result).toBe(184)
    expect(result.response.timestamps.providerIndicatedTimeUnixMs).toBe(1752494400000)
    expect(result.response.timestamps.providerDataReceivedUnixMs).toBe(now)
  })

  it('skips writing to cache if any data is missing', async () => {
    const priceWsMessage: WsResponse = {
      success: true,
      topic: 'price',
      data: [
        {
          symbol: 'GMCI30',
          last_updated: '2025-07-14T12:00:00Z',
          price: 184,
        },
      ],
    }

    transport.price_cache.set(
      'GMCI30',
      {
        params: { index: 'GMCI30', type: 'price' },
        response: {
          result: 184,
          data: {
            result: 184,
            symbol: 'GMCI30',
          },
          timestamps: {
            providerIndicatedTimeUnixMs: 1752494400000,
          },
        },
      },
      90000,
    )

    await transport.processMessage(transport, priceWsMessage)
    expect(mockWrite).not.toHaveBeenCalled()
  })
})
