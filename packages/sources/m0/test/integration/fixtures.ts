import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.m0.xyz', {
    encodedQueryParams: true,
  })
    .post('/api/dashboard-backend-api/api/rpc', { method: 'navDetails' })
    .reply(
      200,
      () => ({
        totalCollateral: 54716821540000,
        totalOwedM: 42847433836220,
        collateralisation: 0.7830760743407144,
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
