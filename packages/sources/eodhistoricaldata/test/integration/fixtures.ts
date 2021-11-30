import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://eodhistoricaldata.com', {
    encodedQueryParams: true,
  })
    .get('/api/real-time/FTSE.INDX')
    .query({ fmt: 'json', api_token: 'fake-api-key' })
    .reply(
      200,
      (_, request) => ({
        code: 'FTSE.INDX',
        timestamp: 1637858100,
        gmtoffset: 0,
        open: 7286.3198,
        high: 7311.9399,
        low: 7286.3198,
        close: 7310.3701,
        volume: 0,
        previousClose: 7286.2998,
        change: 24.0703,
        change_p: 0.3304,
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
