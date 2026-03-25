import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://truflation.invalid', {
    encodedQueryParams: true,
  })
    .get('/cpi')
    .reply(
      200,
      () => ({
        index: [
          '2011-01-01',
          '2010-03-01',
          '2010-04-03',
          '2015-02-06',
          '2013-11-05',
          '2015-06-06', // max
          '2010-08-07',
          '2010-11-08',
        ],
        truflation_us_cpi_frozen_index: [100.1, 100.2, 100.3, 100.4, 100.5, 100.6, 100.7, 100.8],
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
  nock('http://truflation.invalid', {
    encodedQueryParams: true,
  })
    .get('/cpi')
    .reply(
      200,
      () => ({
        index: ['2011-01-01', '2010-03-01', '2010-04-03'],
        truflation_us_cpi_frozen_index: [100.1, 100.2, 100.3, 100.4, 100.5, 100.6, 100.7, 100.8],
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
