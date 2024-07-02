import * as endpoints from '../../src/endpoint'
import testPayload from '../../test-payload.json'

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
