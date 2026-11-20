import { adapter } from '../../src'

describe('adapter wiring', () => {
  it('exposes the ssa endpoint as the default endpoint', () => {
    expect(adapter.defaultEndpoint).toBe('ssa')
    expect(adapter.endpoints.map((endpoint) => endpoint.name)).toEqual(['ssa'])
    expect(adapter.endpoints[0].aliases ?? []).toEqual([])
  })
})
