import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.1forge.com', {
    encodedQueryParams: true,
  })
    .get('/convert')
    .query({ api_key: 'fake-api-key', from: 'USD', to: 'EUR', quantity: 1 })
    .reply(
      200,
      (_, request) => ({
        value: '0.862701',
        text: '1 USD is worth 0.862701 EUR',
        timestamp: 1636478097478,
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
