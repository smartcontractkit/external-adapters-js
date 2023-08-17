import nock from 'nock'

export const mockMCO2Response = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/MCO2')
    .reply(
      200,
      { totalMCO2: 3041044, totalCarbonCredits: 3041044, timestamp: '2022-04-04T11:00:46.577Z' },
      [
        'Date',
        'Mon, 15 Nov 2021 16:14:53 GMT',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '437',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Credentials',
        'true',
        'Access-Control-Allow-Methods',
        'GET, PUT, POST, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers',
        'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization',
        'Server',
        'BTC.com',
        'X-Frame-Options',
        'SAMEORIGIN',
        'X-XSS-Protection',
        '1; mode=block',
        'X-Content-Type-Options',
        'nosniff',
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      ],
    )
    .persist()

export const mockSTBTResponseSuccess = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/STBT')
    .reply(200, {
      accountName: 'STBT',
      totalReserve: 72178807.56,
      totalToken: 71932154.99,
      timestamp: '2023-06-02T12:53:23.604Z',
    })
    .persist()

export const mockSTBTResponseFailure = (): nock.Scope =>
  nock('https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/', {
    encodedQueryParams: true,
  })
    .get('/STBT')
    .reply(200, {
      accountName: 'STBT',
      totalReserve: 72178807.56,
      totalToken: 71932154.99,
      timestamp: '2023-06-02T12:53:23.604Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()
