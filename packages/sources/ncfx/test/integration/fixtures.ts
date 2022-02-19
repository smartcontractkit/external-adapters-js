export const mockLoginResponse = {
  request: {
    request: 'login',
    username: 'user',
    password: 'pass',
  },
  response: {
    Type: 'Info',
    Message: 'Logged in as user: user',
  },
}

export const mockSubscribeResponse = {
  request: {
    request: 'subscribe',
    ccy: 'ETH/USD',
  },
  response: [
    {
      Type: 'Info',
      Message: 'Subcribed to currency pair(s) ETH/USD',
    },
    [
      {
        timestamp: '2022-01-20T01:17:11',
        currencyPair: 'ETH/USD',
        bid: 3106.8495,
        offer: 3107.1275,
        mid: 3106.9885,
        changes: [
          { period: '1h', change: -4.0416731, percentage: -0.12 },
          { period: '1d', change: -54.625719, percentage: -1.72 },
        ],
      },
    ],
  ],
}

export const mockUnsubscribeResponse = {
  request: {
    request: 'unsubscribe',
    ccy: 'ETH/USD',
  },
  response: {
    Type: 'Info',
    Message: 'Unsubscribed to currency pair(s) ETH/USD',
  },
}
