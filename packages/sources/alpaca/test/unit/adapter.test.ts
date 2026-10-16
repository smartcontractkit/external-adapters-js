import { adapter } from '../../src'

describe('adapter', () => {
  it('adapter exposes name ALPACA, default endpoint stock_quotes, and endpoint list [stock_quotes]', () => {
    expect(adapter.name).toBe('ALPACA')
    expect(adapter.defaultEndpoint).toBe('stock_quotes')
    expect(adapter.endpoints.map((endpoint) => endpoint.name)).toEqual(['stock_quotes'])
  })
})
