import nock from 'nock'

export const mockToken = (): nock.Scope =>
  nock('http://fake-auth-api-url', {
    encodedQueryParams: true,
  })
    .post('/gettoken/token')
    .reply(
      200,
      () => ({
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'fake-access-token',
        scope: 'rtg_ssa',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockSecurities = (): nock.Scope =>
  nock('http://fake-api-url', {
    encodedQueryParams: true,
  })
    .get('/ssa-defiscoreapi/extoauthv2/api/v1/ssa/getAllScores')
    .reply(
      200,
      () => [
        {
          last_modified_date_time: '2025-12-19T00:00:00Z',
          security_id: 'AAPL',
          security_name: 'Apple Inc.',
          ssa: '3',
          ssa_desc: 'Strong',
        },
        {
          last_modified_date_time: '2025-12-19T00:00:00Z',
          security_id: 'INVALIDSSA',
          security_name: 'Invalid SSA Inc.',
          ssa: '6',
          ssa_desc: 'Out of range',
        },
        {
          last_modified_date_time: 'not-a-date',
          security_id: 'INVALIDTIME',
          security_name: 'Invalid Time Inc.',
          ssa: '2',
          ssa_desc: 'Satisfactory',
        },
      ],
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
