import nock from 'nock'

export const mockETHBalanceResponseSuccess = (): nock =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
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
      method: 'eth_getBalance',
      params: ['0xef9ffcfbecb6213e5903529c8457b6f61141140d', 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x2fe84e3113d7b' }),
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
      method: 'eth_getBalance',
      params: ['0x6a1544f72a2a275715e8d5924e6d8a017f0e41ed', 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x164451e4741c3ada' }),
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
