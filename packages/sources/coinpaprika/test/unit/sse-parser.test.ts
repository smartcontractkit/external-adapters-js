import { SSEParser } from '../../src/transport/utils'

describe('SSEParser', () => {
  let parser: SSEParser
  let events: Array<{ type: string; data: string }>

  beforeEach(() => {
    parser = new SSEParser('t_s')
    events = []
  })

  it('should parse single complete SSE message', () => {
    const chunk = 'data: {"state_price":100.5}\n\n'

    parser.push(chunk, (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('t_s')
    expect(events[0].data).toBe('{"state_price":100.5}')
  })

  it('should parse chunked SSE messages', () => {
    // Simulate data coming in chunks
    parser.push('data: {"state_pr', (type, data) => {
      events.push({ type, data })
    })
    expect(events).toHaveLength(0) // Not complete yet

    parser.push('ice":100.5}\n\n', (type, data) => {
      events.push({ type, data })
    })
    expect(events).toHaveLength(1)
    expect(events[0].data).toBe('{"state_price":100.5}')
  })

  it('should parse multiple SSE messages', () => {
    const chunk = 'data: {"state_price":100.5}\n\ndata: {"state_price":101.0}\n\n'

    parser.push(chunk, (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(2)
    expect(events[0].data).toBe('{"state_price":100.5}')
    expect(events[1].data).toBe('{"state_price":101.0}')
  })

  it('should handle custom event types', () => {
    const chunk = 'event: custom_event\ndata: {"value":42}\n\n'

    parser.push(chunk, (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('custom_event')
    expect(events[0].data).toBe('{"value":42}')
  })

  it('should ignore comment lines', () => {
    const chunk = ': this is a comment\ndata: {"state_price":100.5}\n\n'

    parser.push(chunk, (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(1)
    expect(events[0].data).toBe('{"state_price":100.5}')
  })

  it('should handle multi-line data', () => {
    const chunk = 'data: {"state_price":\ndata: 100.5}\n\n'

    parser.push(chunk, (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(1)
    expect(events[0].data).toBe('{"state_price":\n100.5}')
  })

  it('should reset properly', () => {
    parser.push('data: {"state_price":', () => {
      // Intentionally empty callback for testing reset functionality
    })
    parser.reset()

    parser.push('data: {"new":true}\n\n', (type, data) => {
      events.push({ type, data })
    })

    expect(events).toHaveLength(1)
    expect(events[0].data).toBe('{"new":true}')
  })
})
