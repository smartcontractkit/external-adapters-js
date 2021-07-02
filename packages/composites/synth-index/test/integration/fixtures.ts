import nock from 'nock'

export function mockCoingeckoResponseSuccess() {
  nock('http://localhost:8081', { encodedQueryParams: true })
    .post('/', {
      id: '1',
      data: {
        base: [
          'UNI',
          'AAVE',
          'LUNA',
          'MKR',
          'SNX',
          'RUNE',
          'SUSHI',
          'COMP',
          'YFI',
          'BNT',
          'UMA',
          'ZRX',
          'CRV',
          '1INCH',
          'REN',
          'BAL',
          'KNC',
          'BOND',
          'CREAM',
          'ALPHA',
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
          'compound-governance-token': {
            usd: 336.69,
          },
          'terra-luna': {
            usd: 5.92,
          },
          sushi: {
            usd: 7.4,
          },
          '0x': {
            usd: 0.697611,
          },
          havven: {
            usd: 6.87,
          },
          uniswap: {
            usd: 18.05,
          },
          'alpha-finance': {
            usd: 0.44541,
          },
          aave: {
            usd: 235.78,
          },
          balancer: {
            usd: 20.31,
          },
          barnbridge: {
            usd: 38.66,
          },
          uma: {
            usd: 9.26,
          },
          thorchain: {
            usd: 6.33,
          },
          'cream-2': {
            usd: 142.07,
          },
          maker: {
            usd: 2565.7,
          },
          bancor: {
            usd: 3.19,
          },
          'curve-dao-token': {
            usd: 1.71,
          },
          '1inch': {
            usd: 2.39,
          },
          'republic-protocol': {
            usd: 0.353853,
          },
          'kyber-network-crystal': {
            usd: 1.59,
          },
          'yearn-finance': {
            usd: 32468,
          },
          results: [
            [
              {
                id: '1',
                data: {
                  base: 'COMP',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              336.69,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'LUNA',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              5.92,
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
              7.4,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'ZRX',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              0.697611,
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
              6.87,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'UNI',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              18.05,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'ALPHA',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              0.44541,
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
              235.78,
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
              20.31,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'BOND',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              38.66,
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
              9.26,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'RUNE',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              6.33,
            ],
            [
              {
                id: '1',
                data: {
                  base: 'CREAM',
                  quote: 'USD',
                  endpoint: 'price',
                },
              },
              142.07,
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
              2565.7,
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
              3.19,
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
              1.71,
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
              2.39,
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
              0.353853,
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
              1.59,
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
              32468,
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
          'UNI',
          'AAVE',
          'LUNA',
          'MKR',
          'SNX',
          'RUNE',
          'SUSHI',
          'COMP',
          'YFI',
          'BNT',
          'UMA',
          'ZRX',
          'CRV',
          '1INCH',
          'REN',
          'BAL',
          'KNC',
          'BOND',
          'CREAM',
          'ALPHA',
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
          'UNI',
          'AAVE',
          'LUNA',
          'MKR',
          'SNX',
          'RUNE',
          'SUSHI',
          'COMP',
          'YFI',
          'BNT',
          'UMA',
          'ZRX',
          'CRV',
          '1INCH',
          'REN',
          'BAL',
          'KNC',
          'BOND',
          'CREAM',
          'ALPHA',
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
