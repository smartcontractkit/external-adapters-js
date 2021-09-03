import nock from 'nock'

export function mockEthereumResponseSuccess() {
  nock('http://localhost:8545')
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x2a' }), [
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
      params: [
        {
          to: '0x0b2cbb1974f17700531439e3e4aff5e5d2aadd4a',
          data: '0x53d467f300000000000000000000000044902e5a88371224d9ac172e391c64257b701ade',
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
          '0x0000000000000000000000000707de6ea02d4558fea1e0a96cad9003f8c1d3840000000000000000000000000000000000000000409b9c1875ebb292771d8090',
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
      params: [
        {
          to: '0x0b2cbb1974f17700531439e3e4aff5e5d2aadd4a',
          data: '0x037276c100000000000000000000000044902e5a88371224d9ac172e391c64257b701ade',
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
          '0x0000000000000000000000000707de6ea02d4558fea1e0a96cad9003f8c1d3840000000000000000000000000000000000000000409b9c1875ebb292771d80d7',
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
      params: [
        {
          to: '0x0b2cbb1974f17700531439e3e4aff5e5d2aadd4a',
          data: '0x81dfa95b000000000000000000000000399acf6102c466a3e4c5f94cd00fc1bfb071d3c100000000000000000000000031d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
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
          '0x000000000000000000000000d7f19f0d395e8c7d5368d74a81b774e2b822df250000000000000000000000000000000000000000000000008ac7230489e80000',
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
}
