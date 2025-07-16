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
