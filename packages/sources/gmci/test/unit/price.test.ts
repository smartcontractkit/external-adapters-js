import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { options } from '../../src/transport/price'
import { convertTimetoUnixMs } from '../../src/transport/util'

//Since the test is directly using transport functions, we need to initialize the logger
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
  const builders = options.builders

  it('builds correct subscribe message for a symbol', () => {
    const message = builders.subscribeMessage({ index: 'GMCI30' })

    expect(message.op).toBe('subscribe')
    expect(message.args).toContain('price.gmci30')
    expect(message.args).toContain('rebalance_status.gmci30')
    expect(message.args.length).toBe(2)
  })
})

describe('handlers.message — rebalance_status topic', () => {
  const handler = options.handlers

  it('parses a rebalance_status message into the expected response format', () => {
    const message = {
      success: true,
      topic: 'rebalance_status',
      data: [
        {
          symbol: 'GMCI30',
          start_time: '2025-07-14T12:00:00Z',
          end_time: '2025-07-14T13:00:00Z',
          status: 'open',
        },
      ],
    }

    const result = handler.message(message)

    expect(result).toHaveLength(1)

    const first = result[0]
    expect(first.params.index).toBe('GMCI30')
    expect(first.params.type).toBe('rebalance_status')

    const response = first.response
    expect(response.data.status).toBe('open')
    expect(response.data.start_time).toBe('2025-07-14T12:00:00Z')
    expect(response.data.end_time).toBe('2025-07-14T13:00:00Z')
    expect(response.data.symbol).toBe('GMCI30')
  })
})

describe('handlers.message — price topic', () => {
  const handler = options.handlers

  it('parses a price message into the expected response format', () => {
    const message = {
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

    const result = handler.message(message)

    expect(result).toHaveLength(1)

    const first = result[0]
    expect(first.params.index).toBe('GMCI30')
    expect(first.params.type).toBe('price')

    const response = first.response
    expect(response.result).toBe(184)
    expect(response.data.result).toBe(184)
    expect(response.data.symbol).toBe('GMCI30')
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1752494400000)
  })
})
