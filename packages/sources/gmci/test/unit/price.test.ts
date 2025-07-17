import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { options, WsTransportTypes } from '../../src/transport/price'
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
    expect(message.args.length).toBe(1)
  })
})

describe('builders.unsubscribeMessage', () => {
  const builders = options.builders!
  const context = {} as EndpointContext<WsTransportTypes>

  it('builds correct unsubscribe message for a symbol', () => {
    const message = builders.unsubscribeMessage!({ index: 'GMCI30' }, context) as any
    expect(message.op).toBe('unsubscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args.length).toBe(1)
  })
})

describe('message handler', () => {
  it('parses a valid price message', () => {
    const mockpriceMessage = {
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

    const results = options.handlers.message(mockpriceMessage)

    expect(results).toEqual([
      {
        params: { index: 'GMCI30' },
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
    const mockUnsuccessfulMessage = {
      success: false,
      topic: 'price',
      data: [],
    }

    const result = options.handlers.message(mockUnsuccessfulMessage)
    expect(result).toBeUndefined()
  })

  it('parses multiple price entries', () => {
    const mockMessage = {
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

    const results = options.handlers.message!(mockMessage)

    expect(results).toHaveLength(2)
    expect(results?.[0].params.index).toBe('GMCI30')
    expect(results?.[1].params.index).toBe('GML2')
  })
})
