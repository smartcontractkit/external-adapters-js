import nock from 'nock'

export const mockTokenResponse = (): nock.Scope => {
  return nock('https://test-url.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({ token: '111111111111111111111111111' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist(true)
}

export const mockSubscribeResponse = {
  request: { type: 'subscribe', signals: ['markPrice_ETH/USD'] },
  response: [
    { message: { type: 'subscribed', signals: ['markPrice_ETH/USD'] } },
    {
      type: 'signal_update',
      signal: 'markPrice_ETH/USD',
      ts: 1660041469.1530244,
      value: 1673.3236752947848,
    },
  ],
}
