import nock from 'nock'

export const mockAuthResponseSuccess = (): nock.Scope =>
  nock('https://open.syncnav.com')
    .post('/api/oauth/token') // Don't specify body matching
    .reply(200, {
      access_token: 'some_token',
      token_type: 'Bearer',
      scopes: [],
      expires: 604800,
    })
    .persist()

export const mockReserveResponseSuccess = (fundId: number): nock.Scope =>
  nock('https://open.syncnav.com/api', {
    encodedQueryParams: true,
  })
    .get(`/funds/${fundId}/reserves`)
    .reply(
      200,
      () => ({
        code: 0,
        message: 'success',
        data: {
          fundId: 8,
          fundName: 'CashPlus_BSC',
          totalAum: '0',
          totalSupply: '9534.885',
          updatedAt: '2025-09-22 20:00:01',
          ripcord: false,
          ripcordDetails: null,
        },
        timestamp: 1758542882,
        traceID: 'c872cb2e6f9967180ebbdc38d4087023',
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

export const mockReserveResponseRipcord = (fundId: number): nock.Scope =>
  nock('https://open.syncnav.com/api', {
    encodedQueryParams: true,
  })
    .get(`/funds/${fundId}/reserves`)
    .reply(
      200,
      () => ({
        code: 0,
        message: 'success',
        data: {
          fundId: 8,
          fundName: 'CashPlus_BSC',
          totalAum: '800',
          totalSupply: '9534.885',
          updatedAt: '2025-09-22 20:00:01',
          ripcord: true,
          ripcordDetails: 'some ripcord details',
        },
        timestamp: 1758542882,
        traceID: 'c872cb2e6f9967180ebbdc38d4087023',
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

export const mockNavResponseSuccess = (fundId: number): nock.Scope =>
  nock('https://open.syncnav.com/api/funds', {
    encodedQueryParams: true,
  })
    .get(`/${fundId}/nav-daily`)
    .reply(
      200,
      () => ({
        code: 0,
        message: 'success',
        data: {
          list: [
            {
              fundId: 8,
              fundName: 'CashPlus_BSC',
              netAssetValueDate: '2025-08-26',
              netAssetValue: '105.129',
              assetsUnderManagement: '1001295.273276',
              outstandingShares: '9524.444',
              netIncomeExpenses: '0',
            },
            {
              fundId: 8,
              fundName: 'CashPlus_BSC',
              netAssetValueDate: '2025-08-25',
              netAssetValue: '105.117',
              assetsUnderManagement: '1001180.979948',
              outstandingShares: '9524.444',
              netIncomeExpenses: '0',
            },
          ],
        },
        timestamp: 1758542882,
        traceID: 'c872cb2e6f9967180ebbdc38d4087023',
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

// export const mockAuthResponseTimeout = (): nock.Scope =>
//   nock('https://open.syncnav.com')
//     .post('/api/oauth/token')
//     .socketDelay(60000)
//     .reply(200, {
//       access_token: 'some_token',
//       token_type: 'Bearer',
//       scopes: [],
//       expires: 604800,
//     })
//     .persist()
