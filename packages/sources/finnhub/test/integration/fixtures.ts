import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope => {
  return nock('https://finnhub.io/api/v1', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/quote')
    .query({ token: 'fake-api-key', symbol: 'OANDA:EUR_USD' })
    .reply(
      200,
      () => ({
        c: 1.15894,
        d: 0.00226,
        dp: 0.1954,
        h: 1.15943,
        l: 1.15497,
        o: 1.1554,
        pc: 1.15668,
        t: 1636322400,
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
    .get('/quote')
    .query({ token: 'fake-api-key', symbol: 'AAPL' })
    .reply(
      200,
      () => ({
        c: 175.43,
        d: 2.44,
        dp: 1.4105,
        h: 175.77,
        l: 173.11,
        o: 173.32,
        pc: 172.99,
        t: 1636322400,
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
    .get('/quote')
    .query({ token: 'fake-api-key', symbol: 'FHFX:GBP-USD' })
    .reply(
      200,
      () => ({
        c: 1.2357,
        d: 0.00336,
        dp: 0.1954,
        h: 1.23573,
        l: 1.23577,
        o: 1.2357,
        pc: 1.23578,
        t: 1636322400,
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
}
