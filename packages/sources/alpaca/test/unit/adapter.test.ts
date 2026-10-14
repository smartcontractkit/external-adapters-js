import { adapter } from '../../src'

describe('adapter', () => {
  it('adapter exports stock_quotes as default endpoint', () => {
    expect(adapter.name).toBe('ALPACA')
    expect(adapter.defaultEndpoint).toBe('stock_quotes')
    expect(adapter.endpoints.map((endpoint) => endpoint.name)).toEqual(['stock_quotes'])
  })
})
