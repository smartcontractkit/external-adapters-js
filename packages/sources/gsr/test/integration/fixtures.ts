import nock from 'nock'

export const mockTokenResponse = (): nock.Scope => {
  return nock('https://test-url.com', {
    encodedQueryParams: true,
  })
    .post('/token', {
      apiKey: 'test-pub-key',
      userId: 'test-user-id',
      ts: 1652198967193000000,
      signature: '13728be3a8ec1855ef66662d5e3ad3c9cfe7e78293d0389c80314a37f4156325',
    })
    .reply(
      200,
      () => ({
        success: true,
        ts: 1652198967193000000,
        token: 'fake-token',
        validUntil: '2022-05-10T16:19:18.235Z',
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
    .persist(true)
}

export const mockSubscribeResponse = {
  request: { action: 'subscribe', symbols: ['ETH.USDT'] },
  response: [
    {
      type: 'ok',
      text: 'Subscribed to ETH.USDT',
      data: { action: 'subscribe', symbols: ['ETH.USD'] },
    },
    {
      type: 'ticker',
      data: { symbol: 'ETH.USDT', price: 12345, ts: 1649763026422917115 },
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: { action: 'unsubscribe', symbols: ['ETH.USDT'] },
  response: [
    {
      type: 'ok',
      text: 'Unsubscribed to ETH.USDT',
      data: { action: 'unsubscribe', symbols: ['ETH.USDT'] },
    },
  ],
}
