import nock from 'nock'

export function mockPriceResponse() {
  nock('https://tools.dxfeed.com:443', { encodedQueryParams: true })
    .get('/webservice/rest/events.json')
    .query({ events: 'Trade', symbols: 'UKX.IND%3ATEI' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'UKX.IND:TEI': {
            eventSymbol: 'UKX.IND:TEI',
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
