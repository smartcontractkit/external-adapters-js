import nock from 'nock'

export const mockMoonSuccess = (): nock.Scope =>
  nock('https://gateway-api.fluent.finance/v1/gateway', {
    encodedQueryParams: true,
  })
    .get('/balances/moon')
    .reply(
      200,
      () => [
        {
          number: '9000000003481',
          name: '*Checking Account*',
          type: 'SAVINGS',
          balance: 24681.55,
          availableBalance: 24681.55,
          active: true,
          currencyCode: 'USD',
        },
        {
          number: '9000000003482',
          name: '*Checking Account*',
          type: 'SAVINGS',
          balance: 10618.0,
          availableBalance: 10618.0,
          active: true,
          currencyCode: 'USD',
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
