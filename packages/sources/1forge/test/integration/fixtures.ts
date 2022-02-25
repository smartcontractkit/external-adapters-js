import nock from 'nock'

export const mockResponseSuccessConvertEndpoint = (): nock =>
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

export const mockResponseSuccessQuotesEnpoint = (): nock =>
  nock('https://api.1forge.com', {
    encodedQueryParams: true,
  })
    .get('/quotes')
    .query({ api_key: 'fake-api-key', pairs: 'USD/EUR' })
    .reply(
      200,
      (_, request) => [
        {
          p: 0.8828,
          a: 0.8828,
          b: 0.8827,
          s: 'USD/EUR',
          t: 1641851954307,
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

export const mockLoginResponse = {
  request: 'login|fake-api-key',
  response: [
    'message|Connected to 1Forge Socket Server. If you need help, please email contact@1forge.com',
    'message|You are currently using 1 out of 10 sessions',
    'post_login_success|undefined',
  ],
}

export const mockSubscribeResponse = {
  request: 'subscribe_to|USD/EUR',
  response: 'update|{"p":0.88935,"a":0.88938,"b":0.88932,"s":"USD/EUR","t":1645811011686}',
}

export const mockUnsubscribeResponse = {
  request: 'unsubscribe_from|USD/EUR',
  response: '',
}
