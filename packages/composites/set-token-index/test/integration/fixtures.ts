import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export const dataProviderConfig = {
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_PROVIDER_URL',
    providerUrl: 'http://localhost:8082',
  },
}

export const symbols = ['LINK', 'RENFIL', 'GRT', 'BAT', 'LPT', 'OCEAN', 'NMR']

export const mockDataProviderResponses = (): void => {
  for (const symbol of symbols) {
    nock(dataProviderConfig.coinmarketcap.providerUrl)
      .post('/', { id: '1', data: { base: symbol, quote: 'USD', endpoint: 'crypto' } })
      .reply(
        200,
        {
          jobRunID: '1',
          providerStatusCode: 200,
          data: {
            result: 130.27,
          },
          result: 130.27,
          statusCode: 200,
        },
        [
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
        ],
      )
  }

  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }),
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
          to: '0x78733fa5e70e3ab61dc49d93921b289e4b667093',
          data: '0x7b89175700000000000000000000000033d63ba1e57e54779f7ddaeaa7109349344cf5f1',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000007000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca000000000000000000000000d5147bc8e386d91cc5dbe72099dac6c9b99276f5000000000000000000000000c944e90c64b2c07662a292be6244bdf05cda44a70000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef00000000000000000000000058b6a8a3302369daec383334672404ee733ab239000000000000000000000000967da4048cd07ab37855c090aaf366e4ce1b9f480000000000000000000000001776e1f26f98b1a5df9cd347953a26dd3cb4667100000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000bbb68a86d49710200000000000000000000000000000000000000000000000004287ea95c86313a0000000000000000000000000000000000000000000000019711a682b93ee21e000000000000000000000000000000000000000000000000ec655481e2eb289900000000000000000000000000000000000000000000000003c853c709d0202f00000000000000000000000000000000000000000000000041101194db582a4c00000000000000000000000000000000000000000000000000e7746d0e81d755',
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
    .post('/', { method: 'net_version', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        id: request['id'],
        jsonrpc: '2.0',
        result: '3',
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
      params: [{ to: '0x514910771af9ca656af840dff83e8264ecf986ca', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000044c494e4b00000000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0x514910771af9ca656af840dff83e8264ecf986ca', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
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
      params: [{ to: '0xd5147bc8e386d91cc5dbe72099dac6c9b99276f5', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
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
      params: [{ to: '0xc944e90c64b2c07662a292be6244bdf05cda44a7', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
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
      params: [{ to: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000018',
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
      params: [{ to: '0x58b6a8a3302369daec383334672404ee733ab239', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000010',
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
      params: [{ to: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000008',
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
      params: [{ to: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000005',
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
      params: [{ to: '0xd5147bc8e386d91cc5dbe72099dac6c9b99276f5', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000672656e46494c0000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0xc944e90c64b2c07662a292be6244bdf05cda44a7', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034752540000000000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034241540000000000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0x58b6a8a3302369daec383334672404ee733ab239', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034c50540000000000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000054f4345414e000000000000000000000000000000000000000000000000000000',
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
      params: [{ to: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671', data: '0x95d89b41' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034e4d520000000000000000000000000000000000000000000000000000000000',
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
