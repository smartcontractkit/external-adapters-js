import nock from 'nock'

export function mockCoingeckoResponseSuccess() {
  nock('http://localhost:8081', { encodedQueryParams: true })
    .post('/', {
      id: '1',
      data: {
        base: [
          'COMP',
          'MKR',
          'AAVE',
          'UMA',
          'SNX',
          'REN',
          'UNI',
          'KNC',
          'CRV',
          'SUSHI',
          'YFI',
          'BAL',
          'BNT',
          '1INCH',
        ],
        quote: 'USD',
        endpoint: 'price',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        data: {
          havven: { usd: 6.56 },
          uma: { usd: 8.75 },
          sushi: { usd: 6.98 },
          aave: { usd: 204.24 },
          uniswap: { usd: 17.55 },
          'compound-governance-token': { usd: 238.01 },
          maker: { usd: 2289.72 },
          balancer: { usd: 16.53 },
          bancor: { usd: 3.05 },
          'curve-dao-token': { usd: 1.49 },
          '1inch': { usd: 2.59 },
          'republic-protocol': { usd: 0.34087 },
          'kyber-network-crystal': { usd: 1.33 },
          'yearn-finance': { usd: 30671 },
          results: {
            SNX: 6.56,
            UMA: 8.75,
            SUSHI: 6.98,
            AAVE: 204.24,
            UNI: 17.55,
            COMP: 238.01,
            MKR: 2289.72,
            BAL: 16.53,
            BNT: 3.05,
            CRV: 1.49,
            '1INCH': 2.59,
            REN: 0.34087,
            KNC: 1.33,
            YFI: 30671,
          },
        },
        metricsMeta: {
          feedId: '[COMP|MKR|AAVE|UMA|SNX|REN|UNI|KNC|CRV|SUSHI|YFI|BAL|BNT|1INCH]/USD',
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
}

/**
 * Mock a failure response from coingecko that originates from a broken redis connection.
 *
 * @param postInitialFailures The number of 500 failures to return after the
 * initial redis failure
 */
export function mockCoingeckoResponseFailureRedis(postInitialFailures = 2) {
  nock('http://localhost:8081', { encodedQueryParams: true })
    .post('/', {
      id: '1',
      data: {
        base: [
          'COMP',
          'MKR',
          'AAVE',
          'UMA',
          'SNX',
          'REN',
          'UNI',
          'KNC',
          'CRV',
          'SUSHI',
          'YFI',
          'BAL',
          'BNT',
          '1INCH',
        ],
        quote: 'USD',
        endpoint: 'price',
      },
    })
    .reply(
      500,
      {
        jobRunID: '1',
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'AdapterError',
          message: 'Redis connection in broken state: retry aborted.',
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '145',
        'ETag',
        'W/"91-Rjnm+zwY8CIKJIqxRpPaBW5XgOI"',
        'Date',
        'Thu, 24 Jun 2021 01:58:00 GMT',
        'Connection',
        'close',
      ],
    )

  nock('http://localhost:8081', { encodedQueryParams: true })
    .post('/', {
      id: '1',
      data: {
        base: [
          'COMP',
          'MKR',
          'AAVE',
          'UMA',
          'SNX',
          'REN',
          'UNI',
          'KNC',
          'CRV',
          'SUSHI',
          'YFI',
          'BAL',
          'BNT',
          '1INCH',
        ],
        quote: 'USD',
        endpoint: 'price',
      },
    })
    .times(postInitialFailures)
    .reply(
      500,
      {
        jobRunID: '1',
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'AdapterError',
          message: "GET can't be processed. The connection is already closed.",
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '154',
        'ETag',
        'W/"9a-EbDjtEh0DmR7gH0UNLpFXHcH9Pw"',
        'Date',
        'Thu, 24 Jun 2021 01:58:01 GMT',
        'Connection',
        'close',
      ],
    )
}
