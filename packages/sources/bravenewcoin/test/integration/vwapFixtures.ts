import nock from 'nock'

export function mockVwapEndpointSuccess() {
  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .post('/oauth/token', {
      audience: 'https://api.bravenewcoin.com',
      client_id: 'test-client-id',
      grant_type: 'client_credentials',
    })
    .reply(200, {}, [
      'Content-Type',
      'application/json;charset=UTF-8',
      'Date',
      'Thu, 21 Oct 2021 17:44:49 GMT',
      'Server',
      'RapidAPI-1.2.8',
      'Via',
      '1.1 4dde8ec6d6c12741888c2d3a059d4a2f.cloudfront.net (CloudFront)',
      'X-Amz-Cf-Id',
      '2FIGEYjKJgO_PERpRD6TmkBvpaLCMirG5HW0vLKvLtxfwAax2nmMUA==',
      'X-Amz-Cf-Pop',
      'HIO50-C1',
      'X-Cache',
      'Miss from cloudfront',
      'X-RapidAPI-Region',
      'AWS - us-west-2',
      'X-RapidAPI-Version',
      '1.2.8',
      'Content-Length',
      '1120',
      'Connection',
      'Close',
    ])

  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/asset')
    .query({ status: 'ACTIVE', symbol: 'ETH' })
    .reply(
      200,
      {
        content: [
          {
            id: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
            name: 'Ethereum',
            symbol: 'ETH',
            slugName: 'ethereum',
            status: 'ACTIVE',
            type: 'CRYPTO',
            url: 'https://www.ethereum.org/',
          },
        ],
      },
      [
        'Age',
        '25',
        'Cache-Control',
        'max-age=300',
        'Content-Type',
        'application/json',
        'Date',
        'Thu, 21 Oct 2021 17:44:50 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 28a7186077f9b5270d98dd053f31303f.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'Sh1Iyif3RPdddUQpdbM7LuXHz52f0PwBV5TlVr-XHFK3M9IY4B8dqQ==',
        'X-Amz-Cf-Pop',
        'HIO50-C1',
        'X-Cache',
        'Hit from cloudfront',
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
        '182',
        'Connection',
        'Close',
      ],
    )

  nock('https://bravenewcoin.p.rapidapi.com:443', { encodedQueryParams: true })
    .get('/ohlcv')
    .query({
      indexId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
      size: '1',
    })
    .reply(
      200,
      {
        content: [
          {
            indexId: 'e991ba77-d384-48ff-b0a4-40e95ef6b7d6',
            indexType: 'GWA',
            open: 3872.444353468022,
            high: 4148.839979992307,
            low: 3830.078382818216,
            close: 4137.589066216359,
            volume: 3373487.6142539503,
            vwap: 3969.76725876602,
            twap: 3957.582228402148,
            startTimestamp: '2021-10-20T00:00:00Z',
            endTimestamp: '2021-10-20T23:59:59.999Z',
            timestamp: '2021-10-20T00:00:00Z',
            id: '735b94df-008c-4fc3-a50c-af0f2e0b25c4',
          },
        ],
        nextId: '735b94df-008c-4fc3-a50c-af0f2e0b25c4',
      },
      [
        'Cache-Control',
        'max-age=30',
        'Content-Type',
        'application/json',
        'Date',
        'Thu, 21 Oct 2021 17:44:50 GMT',
        'Server',
        'RapidAPI-1.2.8',
        'Via',
        '1.1 6ba2a21321beeef65404429d0a4b6381.cloudfront.net (CloudFront)',
        'X-Amz-Cf-Id',
        'vbAxF3uSbWWnr5FBABWDk5_zT4QATJ6JPFFvULp7TrROGghhzdybhQ==',
        'X-Amz-Cf-Pop',
        'HIO50-C1',
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
        '468',
        'Connection',
        'Close',
      ],
    )
}
