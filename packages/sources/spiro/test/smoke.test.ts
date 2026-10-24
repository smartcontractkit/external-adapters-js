import { adapter } from '../src'
it('the spiro adapter boots', () => {
  expect(adapter.name).toBe('SPIRO')
  expect(adapter.defaultEndpoint).toBe('nav')
  expect(adapter.endpoints.map((e) => e.name).sort()).toEqual(['nav', 'por'])
})
