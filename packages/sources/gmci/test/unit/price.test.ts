import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { options, WsResponse, WsTransportTypes } from '../../src/transport/price'
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
    const message = builders.subscribeMessage!({ symbol: 'GMCI30' }, context) as any
    expect(message.op).toBe('subscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args.length).toBe(1)
  })
})

describe('builders.unsubscribeMessage', () => {
  const builders = options.builders!
  const context = {} as EndpointContext<WsTransportTypes>

  it('builds correct unsubscribe message for a symbol', () => {
    const message = builders.unsubscribeMessage!({ symbol: 'GMCI30' }, context) as any
    expect(message.op).toBe('unsubscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args.length).toBe(1)
  })
})

describe('message handler', () => {
  const handlers = options.handlers!
  const context = {} as EndpointContext<WsTransportTypes>

  it('parses a valid price message', () => {
    const mockpriceMessage: WsResponse = {
      success: true,
      topic: 'price',
      data: [
        {
          symbol: 'GMCI30',
          price: 190,
          last_updated: '2025-07-17T12:33:08.476312Z',
        },
      ],
    }

    const results = handlers.message(mockpriceMessage, context)

    expect(results).toEqual([
      {
        params: { symbol: 'GMCI30' },
        response: {
          result: 190,
          data: {
            result: 190,
            symbol: 'GMCI30',
          },
          timestamps: {
            providerIndicatedTimeUnixMs: convertTimetoUnixMs('2025-07-17T12:33:08.476312Z'),
          },
        },
      },
    ])
  })

  it('returns nothing for unsuccessful messages', () => {
    const mockUnsuccessfulMessage: WsResponse = {
      success: false,
      topic: 'price',
      data: [],
    }

    const result = handlers.message(mockUnsuccessfulMessage, context)
    expect(result).toBeUndefined()
  })

  it('parses multiple price entries', () => {
    const mockMessage: WsResponse = {
      success: true,
      topic: 'price',
      data: [
        {
          symbol: 'GMCI30',
          price: 190,
          last_updated: '2024-01-01T00:00:00Z',
        },
        {
          symbol: 'GML2',
          price: 35.45,
          last_updated: '2024-01-02T00:00:00Z',
        },
      ],
    }

    const results = handlers.message(mockMessage, context)

    expect(results).toHaveLength(2)
    expect(results?.[0].params.symbol).toBe('GMCI30')
    expect(results?.[1].params.symbol).toBe('GML2')
  })

  it('return nothing for rebalance message', () => {
    const mockMessage: WsResponse = {
      success: true,
      topic: 'rebalance_status',
      data: [
        {
          symbol: 'GMCI30',
          status: 'rebalanced',
          start_time: '2024-03-29T15:30:00Z',
          end_time: '2024-03-29T16:30:00Z',
        },
      ],
    }

    const result = handlers.message(mockMessage, context)
    expect(result).toEqual([])
  })
})
