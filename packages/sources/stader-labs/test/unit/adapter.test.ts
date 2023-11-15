import * as adapter from '../../src'
import * as endpoints from '../../src/endpoint'
import testPayload from '../../test-payload.json'

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

describe('test-payload.json', () => {
  it('should contain all endpoints/aliases', () => {
    const endpointsWithAliases = Object.keys(endpoints)
      .map((e) => [...(endpoints[e as keyof typeof endpoints].supportedEndpoints || [])])
      .flat()
    endpointsWithAliases.forEach((alias) => {
      const requests = testPayload.requests as { endpoint?: string }[]
      const aliasedRequest = requests.find((req) => req?.endpoint === alias)
      expect(aliasedRequest).toBeDefined()
    })
  })
})
