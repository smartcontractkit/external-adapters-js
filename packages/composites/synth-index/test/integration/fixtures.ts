import nock from 'nock'

export function mockCoingeckoResponseSuccess() {
  nock('http://localhost:8081', { encodedQueryParams: true })
    .post('/', {
      id: '1',
      data: {
        base: 'COMP',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 336.69,
        metricsMeta: {
          feedId: 'COMP/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'LUNA',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 5.92,
        metricsMeta: {
          feedId: 'LUNA/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'SUSHI',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 7.4,
        metricsMeta: {
          feedId: 'SUSHI/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'ZRX',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 0.697611,
        metricsMeta: {
          feedId: 'ZRX/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'SNX',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 6.87,
        metricsMeta: {
          feedId: 'SNX/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'UNI',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 18.05,
        metricsMeta: {
          feedId: 'UNI/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'ALPHA',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 0.44541,
        metricsMeta: {
          feedId: 'ALPHA/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'AAVE',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 235.78,
        metricsMeta: {
          feedId: 'AAVE/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'RUNE',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 6.33,
        metricsMeta: {
          feedId: 'RUNE/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'BOND',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 38.66,
        metricsMeta: {
          feedId: 'BOND/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'UMA',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 9.26,
        metricsMeta: {
          feedId: 'UMA/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'BAL',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 20.31,
        metricsMeta: {
          feedId: 'BAL/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'CREAM',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 142.07,
        metricsMeta: {
          feedId: 'CREAM/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'MKR',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 2565.7,
        metricsMeta: {
          feedId: 'MKR/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'BNT',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 3.19,
        metricsMeta: {
          feedId: 'BNT/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'CRV',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 1.71,
        metricsMeta: {
          feedId: 'CRV/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: '1INCH',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 2.39,
        metricsMeta: {
          feedId: '1INCH/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'REN',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 0.353853,
        metricsMeta: {
          feedId: 'REN/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'KNC',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 1.59,
        metricsMeta: {
          feedId: 'KNC/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
    .post('/', {
      id: '1',
      data: {
        base: 'YFI',
        quote: 'USD',
        endpoint: 'crypto',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        maxAge: 30000,
        statusCode: 200,
        result: 32468,
        metricsMeta: {
          feedId: 'YFI/USD',
        },
        debug: {
          batchablePropertyPath: [
            {
              name: 'base',
            },
            {
              name: 'quote',
            },
          ],
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
        endpoint: 'crypto',
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
        endpoint: 'crypto',
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

/**
 * Mock a failure response from coingecko that originates from a connection failure.
 *
 * @param postInitialFailures The number of failures to return
 */
export function mockCoingeckoConnectionFailure(times = 1) {
  nock('http://localhost:8080', { encodedQueryParams: true })
    .post('/', { id: '1', data: { base: 'sDEFI', to: 'usd', source: 'coingecko' } })
    .times(times)
    .reply(
      500,
      {
        jobRunID: '1',
        status: 'errored',
        statusCode: 500,
        error: { name: 'AdapterError', message: 'connect ECONNREFUSED 127.0.0.1:8081' },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '132',
        'ETag',
        'W/"84-Phw7pmGpUf4AdtvBSGT5BNf2lT4"',
        'Date',
        'Wed, 18 Aug 2021 19:37:03 GMT',
        'Connection',
        'close',
      ],
    )
}
