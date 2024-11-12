import nock from 'nock'

export const mockSourceEAResponse = (url: string, endpoint = 'crypto') => {
  nock(url)
    .post('/', {
      data: { base: 'WBTC', quote: 'USD', endpoint },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          someData: 130.27,
        },
        result: 130.27,
        statusCode: 200,
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

  nock(url)
    .post('/', {
      data: { base: 'DAI', quote: 'USD', endpoint },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          someData: 130.27,
        },
        result: 130.27,
        statusCode: 200,
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

  nock(url)
    .post('/', {
      data: { base: 'DAI', quote: 'EUR', endpoint },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          someData: 130.27,
        },
        result: 130.27,
        statusCode: 200,
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

  nock(url)
    .post('/', {
      data: { base: 'WBTC', quote: 'EUR', endpoint },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          someData: 130.27,
        },
        result: 130.27,
        statusCode: 200,
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
