import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://www.etherchain.org')
    .get('/api/gasnow')
    .reply(
      200,
      {
        code: 200,
        data: {
          rapid: 69000000000,
          fast: 38200000000,
          standard: 17122906179,
          slow: 15280244053,
          timestamp: 1654610878715,
          priceUSD: 1760.29,
        },
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
