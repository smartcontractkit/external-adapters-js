import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://metals-api.com/api/', {
    encodedQueryParams: true,
  })
    .get('/convert')
    .query({ access_key: 'fake-api-key', from: 'XAU', to: 'USD', amount: 1 })
    .reply(
      200,
      (_, request) => ({
        success: true,
        query: { from: 'XAU', to: 'USD', amount: 1 },
        info: { timestamp: 1637949420, rate: 1785.0181286441143 },
        historical: false,
        date: '2021-11-26',
        result: 1785.0181286441143,
        unit: 'per ounce',
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
