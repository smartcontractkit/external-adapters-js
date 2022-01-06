import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://www.etherchain.org')
    .get('/api/gasPriceOracle')
    .reply(
      200,
      (_, request) => ({
        safeLow: 1,
        standard: 1,
        fast: 1.5,
        fastest: 2,
        currentBaseFee: 126.6,
        recommendedBaseFee: 257,
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
