import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.bitso.com/v3', {
    encodedQueryParams: true,
  })
    .get('/ticker')
    .query({ book: 'btc_ars' })
    .reply(
      200,
      () => ({
        success: true,
        payload: {
          high: '13504981.32',
          last: '12550294.29',
          created_at: '2021-11-16T18:50:20+00:00',
          book: 'btc_ars',
          volume: '5.79730623',
          vwap: '12806994.5372860099',
          low: '12100000.00',
          ask: '12550291.01',
          bid: '12520297.85',
          change_24: '-849449.19',
        },
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

export const mockResponseFailure = (): nock.Scope =>
  nock('https://api.bitso.com/v3', {
    encodedQueryParams: true,
  })
    .get('/ticker')
    .query({ book: 'non_existing' })
    .reply(
      400,
      () => ({
        success: false,
        error: { code: '0301', message: 'Unknown OrderBook non_existing' },
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
