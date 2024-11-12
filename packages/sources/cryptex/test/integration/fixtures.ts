import nock from 'nock'

export function mockEthereumResponseSuccess(): void {
  nock('http://localhost:8545', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, { jsonrpc: '2.0', id: 42, result: '0x1' }, [
      'Date',
      'Thu, 12 May 2022 15:19:43 GMT',
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
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, { jsonrpc: '2.0', id: 42, result: '0x1' }, [
      'Date',
      'Thu, 12 May 2022 15:19:43 GMT',
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
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, { jsonrpc: '2.0', id: 42, result: '0x1' }, [
      'Date',
      'Thu, 12 May 2022 15:19:43 GMT',
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
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, { jsonrpc: '2.0', id: 43, result: '0x1' }, [
      'Date',
      'Thu, 12 May 2022 15:19:43 GMT',
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
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x47e1e89570689c13e723819bf633548d611d630c', data: '0xfeaf968c' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 44,
        result:
          '0x00000000000000000000000000000000000000000000000100000000000002880000000000000000000000000000000000000000000000030ed950bfae5a7e0000000000000000000000000000000000000000000000000000000000627d236100000000000000000000000000000000000000000000000000000000627d23610000000000000000000000000000000000000000000000010000000000000288',
      },
      [
        'Date',
        'Thu, 12 May 2022 15:19:44 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '359',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(200, { jsonrpc: '2.0', id: 45, result: '0x1' }, [
      'Date',
      'Thu, 12 May 2022 15:19:44 GMT',
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
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0xec8761a0a73c34329ca5b1d3dc7ed07f30e836e2', data: '0xfeaf968c' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 46,
        result:
          '0x00000000000000000000000000000000000000000000000200000000000010aa00000000000000000000000000000000000000000000000703dcb51d4b9f006000000000000000000000000000000000000000000000000000000000627d21bd00000000000000000000000000000000000000000000000000000000627d21bd00000000000000000000000000000000000000000000000200000000000010aa',
      },
      [
        'Date',
        'Thu, 12 May 2022 15:19:45 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '359',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .post('/', { id: '1', data: {} })
    .reply(
      200,
      {
        jobRunID: '1',
        result: '0.435918142911669111',
        providerStatusCode: 200,
        statusCode: 200,
        data: { btcDominance: '0.435918142911669111', result: '0.435918142911669111' },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '169',
        'ETag',
        'W/"a9-BCglt6fxhYqpnNbZgwo2DR+YvQM"',
        'Date',
        'Thu, 12 May 2022 15:19:45 GMT',
        'Connection',
        'close',
      ],
    )
}
