import nock from 'nock'

export const mockSuccessfulResponseCoingecko = (): nock => {
  nock('https://external.adapter.com')
    .post('/coingecko', {
      id: '1',
      data: { from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4400.1,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4400.1 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Tue, 30 Nov 2021 05:33:00 GMT',
        'X-RateLimit-Reset',
        '1638250385',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '91',
        'ETag',
        'W/"5b-336W6SWFMKfGuh90hvQDQ8pBArM"',
        'Connection',
        'close',
      ],
    )
    .post('/coingecko', {
      id: '1',
      data: { from: 'LINK', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 17.1,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 17.1 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Tue, 30 Nov 2021 05:33:00 GMT',
        'X-RateLimit-Reset',
        '1638250385',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '91',
        'ETag',
        'W/"5b-336W6SWFMKfGuh90hvQDQ8pBArM"',
        'Connection',
        'close',
      ],
    )
}

export const mockSuccessfulResponseCoinpaprika = (): nock =>
  nock('https://external.adapter.com')
    .post('/coinpaprika', {
      id: '1',
      data: { from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4400.2,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4400.2 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Tue, 30 Nov 2021 05:33:00 GMT',
        'X-RateLimit-Reset',
        '1638250383',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '107',
        'ETag',
        'W/"6b-lQYlgZnpNzhbNYmlxSm02Pk34qo"',
        'Connection',
        'close',
      ],
    )
    .post('/coinpaprika', {
      id: '1',
      data: { from: 'LINK', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 17.2,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 17.2 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Tue, 30 Nov 2021 05:33:00 GMT',
        'X-RateLimit-Reset',
        '1638250383',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '107',
        'ETag',
        'W/"6b-lQYlgZnpNzhbNYmlxSm02Pk34qo"',
        'Connection',
        'close',
      ],
    )
