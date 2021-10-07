import nock from 'nock'

export function mockEthereumResponseSuccess() {
  nock('http://localhost:8545')
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, { jsonrpc: '2.0', id: /^\d+$/, result: '0x1' }, [
      'Date',
      'Tue, 05 Oct 2021 18:06:16 GMT',
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
      params: [{ to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000006',
      }),
      [
        'Date',
        'Tue, 05 Oct 2021 18:06:16 GMT',
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
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0xdac17f958d2ee523a2206206994597c13d831ec7', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000006',
      }),
      [
        'Date',
        'Tue, 05 Oct 2021 18:06:16 GMT',
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
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          data: '0xd06ca61f00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000f41b0',
      }),
      [
        'Date',
        'Tue, 05 Oct 2021 18:06:16 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '295',
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
          to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          data: '0xd06ca61f0000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000007253da9927816ce804',
      }),
      [
        'Date',
        'Tue, 05 Oct 2021 18:06:16 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '295',
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
          to: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          data: '0xd06ca61f0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
}
