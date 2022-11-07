import nock from 'nock'

export const mockTokenSuccess = (): nock.Scope =>
  nock('https://oracle.prod.gsr.io', {
    encodedQueryParams: true,
  })
    .get('/v1')
    .reply(200, {}, [])
