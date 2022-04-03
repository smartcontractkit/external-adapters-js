import nock from 'nock'

export const mockForexSingleSuccess = () =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'ETHUSD' })
    .reply(
      200,
      (_, request) => {
        return {
          endpoint: 'live',
          quotes: [
            {
              ask: 4494.03,
              base_currency: 'ETH',
              bid: 4494.02,
              mid: 4494.0249,
              quote_currency: 'USD',
            },
          ],
          requested_time: 'Fri, 05 Nov 2021 17:11:25 GMT',
          timestamp: 1636132286,
        }
      },
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

export const mockForexBatchedSuccess = () =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'ETHUSD,ETHJPY,BTCUSD,BTCJPY' })
    .reply(
      200,
      (_, request) => {
        return {
          endpoint: 'live',
          quotes: [
            {
              ask: 3388.15,
              base_currency: 'ETH',
              bid: 3387.93,
              mid: 3388.04,
              quote_currency: 'USD',
            },
            {
              ask: 389663,
              base_currency: 'ETH',
              bid: 388814,
              mid: 389238.5,
              quote_currency: 'JPY',
            },
            {
              ask: 43833.68,
              base_currency: 'BTC',
              bid: 43823.78,
              mid: 43828.73,
              quote_currency: 'USD',
            },
            {
              ask: 5036923,
              base_currency: 'BTC',
              bid: 5028879,
              mid: 5032901,
              quote_currency: 'JPY',
            },
          ],
          requested_time: 'Fri, 05 Nov 2021 17:11:25 GMT',
          timestamp: 1636132286,
        }
      },
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

export const mockLiveSuccess = () =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'AAPL' })
    .reply(
      200,
      (_, request) => ({
        endpoint: 'live',
        quotes: [
          {
            ask: 150.51,
            bid: 150.5,
            instrument: 'AAPL',
            mid: 150.50501,
          },
        ],
        requested_time: 'Fri, 05 Nov 2021 17:12:07 GMT',
        timestamp: 1636132328,
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

export const mockResponseFailure = () =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'NON-EXISTING' })
    .reply(
      200,
      (_, request) => ({
        endpoint: 'live',
        quotes: [
          {
            error: 400,
            instrument: 'NON_EXISTING',
            message: 'currency code is invalid',
          },
        ],
        requested_time: 'Fri, 05 Nov 2021 17:17:16 GMT',
        timestamp: 1636132636,
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

export const mockSubscribeResponse = {
  request: {
    userKey: 'fake-api-key',
    symbol: 'ETHUSD',
  },

  response: [
    {
      symbol: 'ETHUSD',
      ts: '1646073761745',
      bid: 2797.53,
      ask: 2798.14,
      mid: 2797.835,
    },
    {
      symbol: 'ETHUSD',
      ts: '1646073761745',
      bid: 2797.53,
      ask: 2798.14,
      mid: 2797.835,
    },
    {
      symbol: 'ETHUSD',
      ts: '1646073761745',
      bid: 2797.53,
      ask: 2798.14,
      mid: 2797.835,
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: null,
  response: '',
}
