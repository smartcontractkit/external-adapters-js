import nock from 'nock'

export const mockAuthResponseUnauthorized = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token')
    .reply(401, {
      error: 'invalid_client',
      error_description: 'Client authentication failed',
    })
    .persist()

export const mockAuthResponseServerError = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token')
    .reply(500, {
      error: 'server_error',
      error_description: 'Internal server error',
    })
    .persist()

export const mockAuthResponseMissingToken = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token')
    .reply(200, {
      token_type: 'Bearer',
      scopes: [],
      expires: 604800,
    })
    .persist()

export const mockAuthResponseMissingExpiry = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token')
    .reply(200, {
      access_token: 'some_token',
      token_type: 'Bearer',
      scopes: [],
    })
    .persist()

export const mockAuthResponseInvalidExpiry = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token')
    .reply(200, {
      access_token: 'some_token',
      token_type: 'Bearer',
      scopes: [],
      expires: 0,
    })
    .persist()
