import nock from 'nock'

export function mockCoinpaprikaAdapterResponseSuccess() {
  nock('http://localhost:8081')
    .post('/', { id: '1', data: { base: ['SUSHI'], quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        statusCode: 200,
        data: {
          results: [
            [
              {
                id: '1',
                data: {
                  endpoint: 'crypto',
                  resultPath: 'price',
                  base: 'SUSHI',
                  quote: 'USD',
                },
                rateLimitMaxAge: 57603,
              },
              3.2489646804045,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Mon, 08 Nov 2021 12:31:31 GMT',
        'X-RateLimit-Reset',
        '1636374693',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '92',
        'ETag',
        'W/"5c-z1n244ezdMwpLTzNvSBGxzBiHkA"',
        'Connection',
        'close',
      ],
    )
}

export function mockEthereumResponseSuccess() {
  nock('http://localhost:8545')
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x8798249c2e607446efb7ad49ec89dd1865ff4272', data: '0x0a087903' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: /^\d+$/,
        result: '0x0000000000000000000000006b3595068778dd592e39a122f4f5a5cf09c90fe2',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          data: '0x70a082310000000000000000000000008798249c2e607446efb7ad49ec89dd1865ff4272',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: /^\d+$/,
        result: '0x00000000000000000000000000000000000000000042e48d80f8a6295f40ec64',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x8798249c2e607446efb7ad49ec89dd1865ff4272', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: /^\d+$/,
        result: '0x00000000000000000000000000000000000000000037e3c68fc69586ff146845',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
}
