import nock from 'nock'

export const mockUSCPIResponseSuccess = (): nock.Scope =>
  nock('https://fees.upvest.co', { encodedQueryParams: true })
    .persist()
    .get('/estimate_eth_fees')
    .reply(
      200,
      {
        success: true,
        updated: '2021-11-30T15:46:00.048Z',
        estimates: {
          fastest: 132.055,
          fast: 131.363,
          medium: 113.447,
          slow: 110.747,
        },
      },
      [
        'Date',
        'Wed, 22 Sep 2021 14:24:17 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '152',
        'Connection',
        'close',
        'Server',
        'nginx',
        'Vary',
        'Origin',
      ],
    )
