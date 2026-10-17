import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../../src/config'
import { transport as stockQuotesTransport } from '../../../src/transport/stock-quotes'
import { dxLinkKeepaliveMessage } from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-keepalive proving test (spec keepalive.interval_seconds=30):
 * after the channel opens, the KEEPALIVE frame goes out from the framework
 * heartbeat hook every WS_HEARTBEAT_INTERVAL_MS — the timer itself is framework
 * business; the adapter owns only the frame and the cadence pin.
 */
describe('dxLink keepalive (spec keepalive: interval_seconds=30, framework WS_HEARTBEAT_INTERVAL_MS)', () => {
  it('the heartbeat handler sends exactly the dxLink KEEPALIVE frame on channel 0', () => {
    // handlers.heartbeat is what the framework timer invokes each interval once
    // the channel is open — a mock server on the wire receives this frame
    const send = jest.fn()
    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
    // ...and the frame builder matches it exactly (spec primary_command cadence pair)
    expect(dxLinkKeepaliveMessage()).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('pins the keepalive cadence at 30000ms (spec interval_seconds=30)', () => {
    // The envDefaultOverride in src/config pins the spec's 30s interval as the
    // framework default: a deployment that does not set the env var keeps the
    // spec cadence
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
