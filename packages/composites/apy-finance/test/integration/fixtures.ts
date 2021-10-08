import nock from 'nock'

export function mockEthereumCalls() {
  nock('http://localhost:8545')
    .persist()
    .post('/v3/4d97c9da8e764ff3b1d466e1e091724f', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }), [
      'Date',
      'Thu, 26 Aug 2021 19:32:18 GMT',
      'Content-Type',
      'application/json',
      'Content-Length',
      '40',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/*', {
      method: 'eth_call',
      params: [
        {
          to: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
          data: '0x0178b8bf5dbc4a41e3633cb8fb4fe64b14f15ba82b7d15b34fdc239d4fc96a9610b03b92',
        },
        'latest',
      ],
      id: 45,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 45,
        result: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
      [
        'Date',
        'Thu, 26 Aug 2021 19:32:19 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '103',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
}

export function mockTiingoResponse() {
  nock('http://localhost:3000')
    .post('/', { id: '1', data: { base: 'USDC', quote: 'USD', endpoint: 'price' } })
    .reply(200, {
      jobRunID: '1',
      data: {
        sources: [],
        payload: {
          WETH: {
            quote: {
              USD: {
                price: '1800',
              },
            },
          },
          LINK: {
            quote: {
              USD: {
                price: '2000',
              },
            },
          },
        },
        result: 2000,
      },
      result: 2000,
      statusCode: 200,
    })

  nock('http://localhost:3000')
    .post('/', { id: '1', data: { base: 'WETH', quote: 'USD', endpoint: 'price' } })
    .reply(200, {
      jobRunID: '1',
      data: {
        sources: [],
        payload: {
          WETH: {
            quote: {
              USD: {
                price: '1800',
              },
            },
          },
          LINK: {
            quote: {
              USD: {
                price: '2000',
              },
            },
          },
        },
        result: 2000,
      },
      result: 2000,
      statusCode: 200,
    })
}
