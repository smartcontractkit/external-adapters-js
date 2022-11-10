import nock from 'nock'

export const mockSubscribeResponse = {
  message: { type: 'subscribed', signals: ['markPrice_ETH/USD'] },
}

export const mockPriceResponse = {
  type: 'signal_update',
  signal: 'markPrice_ETH/USD',
  ts: 1667970828.9702902,
  value: 1279.2012582120603,
}

export const mockTokenResponse = (): nock.Scope =>
  nock('https://test-url.com', {
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
