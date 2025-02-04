import nock from 'nock'

export const mockAuthResponseSuccess = (): nock.Scope =>
  nock('http://auth.com', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(
      200,
      () => ({
        token_type: 'Bearer',
        expires_in: 3599,
        ext_expires_in: 3599,
        access_token: 'token',
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

export const mockNavResponseSuccess = (): nock.Scope =>
  nock('http://nav.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({
      accountName: 'accountName',
    })
    .reply(
      200,
      () => ({
        accountName: 'accountName',
        totalReserve: 1.234567,
        currency: 'USD',
        timestamp: '2025-02-04T06:00:00.000Z',
        ripCord: false,
        ripCordDetails: [],
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
