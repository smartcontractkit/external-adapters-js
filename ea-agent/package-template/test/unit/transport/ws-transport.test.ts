// TODO: update the import paths to target your transport implementation.
import { options as wsOptions } from '../../../src/transport/price-ws'
import type { WsTransportTypes } from '../../../src/transport/price-ws'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'

const SAMPLE_CONTEXT = {
  adapterSettings: {
    WS_API_ENDPOINT: 'wss://example.provider/ws',
  },
} as EndpointContext<WsTransportTypes>

const SAMPLE_PARAMS = {
  base: 'ETH',
  quote: 'USD',
}

describe.skip('WebSocket transport template', () => {
  it('builds subscribe payloads', () => {
    const subscribe = wsOptions.builders?.subscribeMessage
    expect(subscribe).toBeDefined()
    const payload = subscribe?.(SAMPLE_PARAMS, SAMPLE_CONTEXT)
    expect(payload).toEqual({ type: 'subscribe', symbols: 'ETH/USD' })
  })

  it('builds unsubscribe payloads', () => {
    const unsubscribe = wsOptions.builders?.unsubscribeMessage
    expect(unsubscribe).toBeDefined()
    const payload = unsubscribe?.(SAMPLE_PARAMS, SAMPLE_CONTEXT)
    expect(payload).toEqual({ type: 'unsubscribe', symbols: 'ETH/USD' })
  })

  it('maps provider messages to cache responses', () => {
    const handler = wsOptions.handlers.message!
    const message = {
      success: true,
      price: 2000,
      base: 'ETH',
      quote: 'USD',
      time: 1_609_459_200_000,
    }

    const responses = handler(message, SAMPLE_CONTEXT)
    expect(responses).toHaveLength(1)
    expect(responses?.[0].params).toEqual({ base: 'ETH', quote: 'USD' })
    expect(responses?.[0].response?.result).toBe(2000)
  })

  it('skips unsuccessful provider messages', () => {
    const handler = wsOptions.handlers.message!
    const message = {
      success: false,
      price: 0,
      base: 'ETH',
      quote: 'USD',
      time: 0,
    }

    const responses = handler(message, SAMPLE_CONTEXT)
    expect(responses).toBeUndefined()
  })
})

