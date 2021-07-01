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
          uniswap: {
            usd: 18.96,
          },
          aave: {
            usd: 247.63,
          },
          uma: {
            usd: 8.91,
          },
          havven: {
            usd: 7.37,
          },
          'compound-governance-token': {
            usd: 317.93,
          },
          sushi: {
            usd: 8.28,
          },
          maker: {
            usd: 2459.65,
          },
          balancer: {
            usd: 20.9,
          },
          bancor: {
            usd: 3.37,
          },
          'curve-dao-token': {
            usd: 1.83,
          },
          '1inch': {
            usd: 2.64,
          },
          'republic-protocol': {
            usd: 0.390388,
          },
          'kyber-network-crystal': {
            usd: 1.52,
          },
          'yearn-finance': {
            usd: 34189,
          },
          results: [
            [
              {
                id: '1',
                data: {
                  base: 'UNI',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              18.96,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'AAVE',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              247.63,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'UMA',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              8.91,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'SNX',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              7.37,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'COMP',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              317.93,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'SUSHI',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              8.28,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'MKR',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              2459.65,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'BAL',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              20.9,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'BNT',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              3.37,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'CRV',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              1.83,
            ],
            [
              {
                id: '1',
                data: {
                  base: '1INCH',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              2.64,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'REN',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              0.390388,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'KNC',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              1.52,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'YFI',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              34189,
            ],
          ],
        },
        metricsMeta: {
          feedId: '[COMP|MKR|AAVE|UMA|SNX|REN|UNI|KNC|CRV|SUSHI|YFI|BAL|BNT|1INCH]/USD',
        },
        debug: {
          batchablePropertyPath: ['base', 'quote'],
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
