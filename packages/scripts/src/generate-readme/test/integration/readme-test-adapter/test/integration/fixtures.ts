import nock from 'nock'

export function mockBalanceResponse() {
  nock('https://test.api.endpoint.link', { encodedQueryParams: true })
    .get('/address/3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1')
    .reply(
      200,
      {
        status: 200,
        title: 'OK',
        description: 'Successful request',
        payload: {
          address: { address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1' },
          blockchainId: '408fa195a34b533de9ad9889f076045e',
          blockNumber: '693286',
          timestampNanoseconds: 0,
          value: '2188',
          timestamp: '2021-07-29T20:54:39.000Z',
        },
      },
      [],
    )
}

export function mockMarketcapResponse() {
  nock('https://test.api.endpoint.link')
    .get('/marketcap?base=BTC&quote=USD&api_key=mock-api-key')
    .reply(200, { marketcap: 1000000000 }, [
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
    ])
}

export function mockPriceResponse() {
  nock('https://test.api.endpoint.link')
    .get('/price?base=BTC&quote=USD&api_key=mock-api-key')
    .reply(200, { price: 123456 }, [
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
    ])
}
