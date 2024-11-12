import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.exchange.cryptomkt.com/api/3', {
    encodedQueryParams: true,
  })
    .get('/public/ticker/BTCARS')
    .query(() => true)
    .reply(
      200,
      () => ({
        ask: '12395990',
        bid: '12339900',
        last: '12396935',
        low: '11716731',
        high: '12403061',
        open: '11845809',
        volume: '1.62057',
        volume_quote: '19483671.75328',
        timestamp: '2021-11-25T16:27:54.000Z',
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
