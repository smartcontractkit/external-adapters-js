import nock from 'nock'

export const mockNavResponseSuccess = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R9999_9999',
      success: true,
      message: 'Success',
      data: {
        lastUpdate: '2025-11-11T16:55:53.448+00:00',
        tokenName: 'rcusd',
        chainType: 'chain',
        totalSupply: 98,
        totalAsset: 100,
        currentNav: '1.020408163265306',
      },
    })
    .persist()

export const mockNavResponseFailure = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'invalid' })
    .reply(200, {
      code: 'R9999_0001',
      success: false,
      message: 'Token not found',
      data: {},
    })
    .persist()
