import * as adapter from '../../src'

describe('adapter', () => {
  it('has expected root exports', () => {
    expect(adapter).toHaveProperty('NAME')
    expect(typeof adapter.NAME).toBe('string')
    expect(adapter).toHaveProperty('makeExecute')
    expect(typeof adapter.makeExecute).toBe('function')
    expect(adapter).toHaveProperty('makeConfig')
    expect(typeof adapter.makeConfig).toBe('function')
    expect(adapter).toHaveProperty('server')
    expect(typeof adapter.server).toBe('function')
    expect(adapter).toHaveProperty('endpoints')
    expect(typeof adapter.endpoints).toBe('object')
  })
})
