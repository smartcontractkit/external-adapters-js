import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../src/config'
import { transport as stockQuotesTransport } from '../../src/transport/stock-quotes'

LoggerFactoryProvider.set()

describe('dxLink keepalive (spec keepalive: interval_seconds=30)', () => {
  it('sends exactly the KEEPALIVE frame on channel 0 from the heartbeat handler', () => {
    const send = jest.fn()

    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('keeps the KEEPALIVE cadence at the pinned 30s default', () => {
    const oldEnv = process.env['WS_HEARTBEAT_INTERVAL_MS']
    delete process.env['WS_HEARTBEAT_INTERVAL_MS']
    try {
      config.initialize()
      expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(30000)
    } finally {
      if (oldEnv !== undefined) {
        process.env['WS_HEARTBEAT_INTERVAL_MS'] = oldEnv
      }
      config.initialize()
    }
  })
})
