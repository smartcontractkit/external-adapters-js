import nock from 'nock'
import { AdapterRequest } from '../../../../core/bootstrap'

export function mockEthereumResponseSuccess(): void {
  nock('http://localhost:8545')
    .persist()
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:33 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:33 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:33 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x269616d549d7e8eaa82dfb17028d0b212d11232a', data: '0xf7fce334' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request.id,
        result: '0x00000000000000000000000000000000000000000000000000470de4df820000',
      }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:33 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '104',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request.id,
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '104',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x269616d549d7e8eaa82dfb17028d0b212d11232a', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request.id,
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '104',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', result: '0x1', id: request.id }),
      [
        'Date',
        'Tue, 22 Feb 2022 00:53:34 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '40',
        'Connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
          data: '0xd06ca61f0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000269616d549d7e8eaa82dfb17028d0b212d11232a',
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
        id: request.id,
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000003663b263907feb',
      }),
      [
        'Date',
        'Tue, 22 Feb 2022 06:40:30 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '296',
        'Connection',
        'close',
      ],
    )
}
