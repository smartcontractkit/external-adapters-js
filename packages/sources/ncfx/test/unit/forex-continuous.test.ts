import { routeForPair } from '../../src/endpoint/forex-continuous'

describe('routeForPair', () => {
  // The router runs before the uppercase requestTransform, so mixed-case requests for the same
  // pair must still land on the same connection.
  it('routes mixed-case requests for a pair to the same connection', () => {
    expect(routeForPair('ars', 'USD')).toEqual(routeForPair('ARS', 'USD'))
    expect(routeForPair('usd', 'ARS')).toEqual(routeForPair('USD', 'ARS'))
  })
})
