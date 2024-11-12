import nock from 'nock'

export const mockRateResponseSuccess = (): nock.Scope =>
  nock('https://rp.lcx.com/v1', {
    encodedQueryParams: true,
    reqheaders: {
      'api-key': 'fake-api-key',
    },
  })
    .get('/rates/current')
    .query({ coin: 'BTC', currency: 'USD' })
    .reply(
      200,
      () => ({
        status: 'SUCCESS',
        message: 'Reference Price for BTC',
        data: { Price: 58620.71 },
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
