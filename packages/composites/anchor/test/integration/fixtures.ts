import nock from 'nock'

export function mockLunaUSDPrice() {
  nock('http://localhost:5000', { encodedQueryParams: true })
    .persist()
    .post('/', { id: '1', data: { base: 'LUNA', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 69.24,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 69.24 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '246',
        'Date',
        'Fri, 03 Dec 2021 05:46:54 GMT',
        'X-RateLimit-Reset',
        '1638510417',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '87',
        'ETag',
        'W/"57-8u9i5RNCsrlLL47Tvv9xGrhiR8M"',
        'Connection',
        'close',
      ],
    )
}

export function mockSTEthUSDPrice() {
  nock('http://localhost:5000', { encodedQueryParams: true })
    .persist(true)
    .post('/', { id: '1', data: { base: 'ETH', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4507.32,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4507.32 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '246',
        'Date',
        'Fri, 03 Dec 2021 05:00:18 GMT',
        'X-RateLimit-Reset',
        '1638507620',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '91',
        'ETag',
        'W/"5b-KHfirWOAWaJJ23p/s5+6Xh9EidI"',
        'Connection',
        'close',
      ],
    )
}

export function mockETHUSDPrice() {
  nock('http://localhost:5000', { encodedQueryParams: true })
    .post('/', { id: '1', data: { base: 'ETH', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 4538.52,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 4538.52 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '247',
        'Date',
        'Fri, 03 Dec 2021 05:00:18 GMT',
        'X-RateLimit-Reset',
        '1638507620',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '91',
        'ETag',
        'W/"5b-IBWdr0sekrbhz3P+QWo60aW+NIs"',
        'Connection',
        'close',
      ],
    )
}

export function mockBTCUSDPrice() {
  nock('http://localhost:5000', { encodedQueryParams: true })
    .post('/', { id: '1', data: { base: 'BTC', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        result: 56606,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 56606 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '245',
        'Date',
        'Fri, 03 Dec 2021 05:00:19 GMT',
        'X-RateLimit-Reset',
        '1638507620',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '87',
        'ETag',
        'W/"57-FJpBD9pl1FGirmllOirm7tRUlEw"',
        'Connection',
        'close',
      ],
    )
}
