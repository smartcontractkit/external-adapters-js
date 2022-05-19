export const mockSubscribeResponse = {
  request: {
    jsonrpc: '2.0',
    method: 'vwap_subscribe',
    params: {
      tickers: ['ETHEUR'],
    },
  },
  response: [
    {
      jsonrpc: '2.0',
      id: 0,
      result: {
        snapshot: [
          {
            ticker: 'ETHEUR',
            price: 2398.6491068570076,
            size: 1238.9841055992033,
            volume: 32265.21,
          },
        ],
      },
    },
    {
      jsonrpc: '2.0',
      method: 'vwap',
      params: {
        updates: [
          {
            ticker: 'ETHEUR',
            price: 2400.209999999564,
            size: 0.06804130000001375,
            volume: 163.31340867300332,
          },
        ],
      },
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: {
    jsonrpc: '2.0',
    method: 'vwap_unsubscribe',
    params: {
      tickers: ['ETHEUR'],
    },
  },
  response: [
    {
      jsonrpc: '2.0',
      id: 0,
      result: {},
    },
  ],
}

export const mockLoginResponse = {
  request: {
    jsonrpc: '2.0',
    method: 'authentication_logon',
    params: {
      api_key: 'fake-api-key',
    },
  },
  response: [
    {
      jsonrpc: '2.0',
      id: 0,
      result: {
        user_id: 'ABCD',
      },
    },
  ],
}
