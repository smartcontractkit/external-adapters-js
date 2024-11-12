import nock from 'nock'

export function mockPriceEndpoint(): nock.Scope {
  return nock('https://tools.dxfeed.com:443', { encodedQueryParams: true })
    .get('/webservice/rest/events.json')
    .query({ events: 'Trade,Quote', symbols: 'FTSE:BFX' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'FTSE:BFX': {
            eventSymbol: 'FTSE:BFX',
            eventTime: 0,
            time: 1636750796767,
            timeNanoPart: 0,
            sequence: 17844,
            exchangeCode: '',
            price: 7343.84,
            change: -36.21,
            size: 0,
            dayVolume: 'NaN',
            dayTurnover: 'NaN',
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 21:50:50 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools1',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools1',
      ],
    )
}
