import nock from 'nock'

export const mockMaticXSuccess = (): nock.Scope =>
  nock('https://test-rpc-polygon-url:443', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x89' }), [
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
      params: [{ to: '0xee652bbf72689aa59f0b8f981c9c90e2a8af8d8f', data: '0x679aefce' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000e1b77935f500bea',
      }),
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
      params: [{ to: '0xab594600376ec9fd91f8e885dadf0ce036862de0', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        id: request['id'],
        jsonrpc: '2.0',
        result: '0x0000000000000000000000000000000000000000000000000000000002cc7c8f',
      }),
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

export const mockSFTMXSuccess = (): nock.Scope =>
  nock('https://test-rpc-fantom-url:443', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0xfa' }), [
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
      params: [{ to: '0xf4766552d15ae4d256ad41b6cf2933482b0680dc', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000000186426a',
      }),
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
      params: [{ to: '0xb458bfc855ab504a8a327720fcef98886065529b', data: '0xe6aa216c' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        id: request['id'],
        jsonrpc: '2.0',
        result: '0x0000000000000000000000000000000000000000000000000e403e5a87bd5a69',
      }),
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
