import nock from 'nock'

export function mockEthOhlcvEndpoint() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/ohlcv')
    .query({
      indexId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
      indexType: 'GWA',
      timestamp: '2021-10-19T14%3A39%3A21.378Z',
      size: '1',
    })
    .reply(
      200,
      {
        content: [
          {
            indexId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
            indexType: 'GWA',
            open: 3765.2431885139044,
            high: 3886.9531651167786,
            low: 3756.389042507611,
            close: 3876.986679694289,
            volume: 2691954.185714262,
            vwap: 3821.520292860939,
            twap: 3822.090265867128,
            startTimestamp: '2021-10-19T00:00:00Z',
            endTimestamp: '2021-10-19T23:59:59.999Z',
            timestamp: '2021-10-19T00:00:00Z',
            id: '165732a7-abec-43f9-bc3a-bc89420cd96c',
          },
        ],
        nextId: '165732a7-abec-43f9-bc3a-bc89420cd96c',
      },
      [
        'Cache-Control',
        'max-age=30',
        'Content-Type',
        'application/json',
        'Date',
        'Wed, 20 Oct 2021 14:39:22 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 58b8655e3ea662bad02cac6b9d4c88bb.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        '6QJYe8q_oEnpxNRjx63UfZDnipVN2kQItFyuEb_1VrRSjJmlQaUCbQ==',
        'X-Amz-Cf-Pop',
        'SEA19-C3',
        'X-Cache',
        'Miss from cloudfront',
        'x-content-type-options',
        'nosniff',
        'x-frame-options',
        'DENY',
        'X-RapidAPI-Region',
        'AWS - us-west-2',
        'X-RapidAPI-Version',
        '1.2.8',
        'x-xss-protection',
        '1; mode=block',
        'Content-Length',
        '470',
        'Connection',
        'Close',
      ],
    )
}

export function mockVwapResponse() {
  nock('http://localhost:8080', { encodedQueryParams: true })
    .post('/', { id: '2', data: { endpoint: 'vwap', base: 'ETH' } })
    .reply(
      200,
      {
        jobRunID: '2',
        result: 3821.520292860939,
        statusCode: 200,
        data: { result: 3821.520292860939 },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '96',
        'ETag',
        'W/"60-XZbGwgdUFMnCUHuL8U6AQiHlUlo"',
        'Date',
        'Wed, 20 Oct 2021 14:39:22 GMT',
        'Connection',
        'close',
      ],
    )
}
