import { SSEParser } from '../../src/transport/sse'

describe('SSEParser', () => {
  it('parses single event with default type', () => {
    const p = new SSEParser('t_s')
    const events: Array<{ type: string; data: string }> = []
    p.push('data: {"x":1}\n\n', (t, d) => events.push({ type: t, data: d }))
    expect(events).toEqual([{ type: 't_s', data: '{"x":1}' }])
  })

  it('parses multi-line data and explicit event name', () => {
    const p = new SSEParser()
    const events: any[] = []
    p.push('event: t_s\ndata: {"a":1\n', () => {})
    p.push('data: ,"b":2}\n\n', (t, d) => events.push({ t, d }))
    expect(events).toEqual([{ t: 't_s', d: '{"a":1\n,"b":2}' }])
  })

  it('ignores comments and keeps trailing partial line in buffer', () => {
    const p = new SSEParser()
    const events: any[] = []
    p.push(':heartbeat\n', () => {})
    p.push('data: {"ok":true}\n', () => {})
    p.push('\n', (t, d) => events.push({ t, d }))
    expect(events.length).toBe(1)
    expect(events[0].d).toBe('{"ok":true}')
  })
})
