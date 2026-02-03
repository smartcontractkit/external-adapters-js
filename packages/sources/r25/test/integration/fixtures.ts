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
        sevenYield: '8.3266',
      },
    })
    .persist()

export const mockNavResponseInvalidToken = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'invalid' })
    .reply(200, {
      code: 'R9999_0001',
      success: false,
      message: 'Invalid tokenName combination',
      data: {},
    })

export const mockNavResponseInvalidChainType = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'invalid', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R9999_0002',
      success: false,
      message: 'Invalid chainType combination',
      data: {},
    })

export const mockNavResponseInvalidChainTypeAndTokenName = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'invalid', tokenName: 'invalid' })
    .reply(200, {
      code: 'R9999_0001',
      success: false,
      message: 'Invalid tokenName combination',
      data: {},
    })

export const mockNavResponseAuthenticationFailed = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'optimism', tokenName: 'rcusd' })
    .reply(401, {
      error: 'authentication failed',
    })

export const mockNavResponseSignatureFailed = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'avalanche', tokenName: 'rcusd' })
    .reply(401, {
      error: 'signature failed',
    })

export const mockNavResponseInternalServerError = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R0005_00001',
      success: false,
      message: 'System busy, please try again later.',
      data: null,
    })

export const mockNavResponseSupplyQueryFailed = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'ethereum', tokenName: 'rcusd' })
    .reply(200, {
      code: 'R0000_00001',
      success: false,
      message: 'internal error',
      data: null,
    })

export const mockNavResponseExpiredTimestamp = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'arbitrum', tokenName: 'rcusd' })
    .reply(400, {
      error: 'expired timestamp',
    })

export const mockNavResponseParamsMissing = (): nock.Scope =>
  nock('https://app.r25.xyz', {
    encodedQueryParams: true,
    badheaders: ['x-api-key'],
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'base', tokenName: 'rcusdc' })
    .reply(400, {
      error: 'params missing',
    })
