import nock from 'nock'

export function mockPriceEndpoint() {
  nock('https://tools.dxfeed.com:443', { encodedQueryParams: true })
    .get('/webservice/rest/events.json')
    .query({ events: 'Trade', symbols: 'UKX%3AFTSE' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'UKX:FTSE': {
            eventSymbol: 'UKX:FTSE',
            eventTime: 0,
            time: 1636731276000,
            timeNanoPart: 0,
            sequence: 147828,
            exchangeCode: '',
            price: 7347.68,
            change: -36.5,
            size: 0,
            dayVolume: 'NaN',
            dayTurnover: 'NaN',
            tickDirection: 'ZERO_DOWN',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 15:49:36 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools2',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools2',
      ],
    )
}
