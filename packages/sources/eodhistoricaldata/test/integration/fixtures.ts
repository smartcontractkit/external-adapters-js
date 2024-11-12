import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://eodhistoricaldata.com', {
    encodedQueryParams: true,
  })
    .get('/api/real-time/FTSE.INDX')
    .query({ fmt: 'json', api_token: 'fake-api-key' })
    .reply(
      200,
      () => ({
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

export const mockResponseFail = (): nock.Scope =>
  nock('https://eodhistoricaldata.com', {
    encodedQueryParams: true,
  })
    .get('/api/real-time/IBTA')
    .query({ fmt: 'json', api_token: 'fake-api-key' })
    .reply(
      200,
      () => ({
        code: 'IBTA.US',
        timestamp: 'NA',
        gmtoffset: 0,
        open: 'NA',
        high: 'NA',
        low: 'NA',
        close: 'NA',
        volume: 'NA',
        previousClose: 'NA',
        change: 'NA',
        change_p: 'NA',
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

export const mockOverrideResponseSuccess = (): nock.Scope =>
  nock('https://eodhistoricaldata.com', {
    encodedQueryParams: true,
  })
    .get('/api/real-time/IBTA.LSE')
    .query({ fmt: 'json', api_token: 'fake-api-key' })
    .reply(
      200,
      () => ({
        code: 'IBTA.LSE',
        timestamp: 1637858100,
        gmtoffset: 1,
        open: 1286.3198,
        high: 1311.9399,
        low: 1286.3198,
        close: 1310.3701,
        volume: 0,
        previousClose: 1286.2998,
        change: 14.0703,
        change_p: 1.3304,
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
