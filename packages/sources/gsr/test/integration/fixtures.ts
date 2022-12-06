import nock from 'nock'

export const mockTokenSuccess = (): nock.Scope =>
  nock('https://oracle.prod.gsr.io', {
    encodedQueryParams: true,
  })
    .post('/v1/token', {
      apiKey: 'test-pub-key',
      userId: 'test-user-id',
      ts: 1652198967193000000,
      signature: '13728be3a8ec1855ef66662d5e3ad3c9cfe7e78293d0389c80314a37f4156325',
    })
    .reply(
      200,
      () => ({
        success: true,
        ts: 1652198967193000000,
        token: 'fake-token',
        validUntil: '2022-05-10T16:19:18.235Z',
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
