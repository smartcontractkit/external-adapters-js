import nock from 'nock'

export const mockSuccessfulResponsesWithoutCommaSeparatedSources = () => {
  nock('https://adapters.main.stage.cldev.sh')
    .post('/coingecko', {
      id: '1',
      data: { sources: ['coingecko', 'coinpaprika'], from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4417.18,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4417.18 },
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

  nock('https://adapters.main.stage.cldev.sh')
    .post('/coinpaprika', {
      id: '1',
      data: { sources: ['coingecko', 'coinpaprika'], from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4413.9509009216,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4413.9509009216 },
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
}

export const mockSuccessfulResponsesWithCommaSeparatedSources = () => {
  nock('https://adapters.main.stage.cldev.sh')
    .post('/coingecko', {
      id: '1',
      data: { sources: 'coingecko,coinpaprika', from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4417.18,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4417.18 },
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

  nock('https://adapters.main.stage.cldev.sh')
    .post('/coinpaprika', {
      id: '1',
      data: { sources: 'coingecko,coinpaprika', from: 'ETH', to: 'USD' },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4413.9509009216,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4413.9509009216 },
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
}

export const mockSuccessfulResponsesWithSingleSource = () => {
  nock('https://adapters.main.stage.cldev.sh')
    .post('/coingecko', {
      id: '1',
      data: { sources: 'coingecko', from: 'ETH', to: 'USD', minAnswers: 2 },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4417.18,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4417.18 },
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
