import nock from 'nock'

import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export const mockMarketcapSuccess = (): nock.Scope =>
  nock('http://127.0.0.1:8545', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x1',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0xed5af388653567af2f388e6224dc7c4b3241c544', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000002710',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x1823c89715fe3fb96a24d11c917aca918894a090', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000ed007c9a7fcefc00',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000000000280f',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000004bf0',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000002710',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xa8b9a447c73191744d5b79bce864f343455e1150', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000ccca49bbce32d000',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x01b6710b01cf3dd8ae64243097d91afb03728fdd', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xf49f8f5b931b0e4b4246e4cca7cd2083997aa83d', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x1823c89715fe3fb96a24d11c917aca918894a090', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x01b6710b01cf3dd8ae64243097d91afb03728fdd', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000036daf49111acbcc00',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000004bf9',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000001b71',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x027828052840a43cc2d0187bcfa6e3d6ace60336', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000008',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000002710',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000000000020b71bb5c0',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x1a92f7381b9f03921564a437210bb9396471050c', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000000000000000026e8',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x027828052840a43cc2d0187bcfa6e3d6ace60336', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000005cfb2e807b1e0000',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xddf0b85c600daf9e308afed9f597aca212354764', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xe785e82358879f061bc3dcac6f0444462d4b5330', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000002710',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xfaa8f6073845dbe5627daa3208f78a3043f99bca', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000012664b967bb7a400',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xa8b9a447c73191744d5b79bce864f343455e1150', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xddf0b85c600daf9e308afed9f597aca212354764', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000001714ce0b38d4fc00',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x352f2bc3039429fc2fe62004a1575ae74001cfce', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000402f7871f253bb400',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x021264d59dabd26e7506ee7278407891bb8cdccc', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x35bf6767577091e7f04707c0290b3f889e968307', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xfaa8f6073845dbe5627daa3208f78a3043f99bca', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x35bf6767577091e7f04707c0290b3f889e968307', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000039743c10ba1e0000',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xf49f8f5b931b0e4b4246e4cca7cd2083997aa83d', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000020e7073d9a7ae400',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x352f2bc3039429fc2fe62004a1575ae74001cfce', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000002710',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:09 GMT',
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
      params: [{ to: '0x021264d59dabd26e7506ee7278407891bb8cdccc', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest<EmptyInputParameters>) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000004b35057819f59800',
      }),
      [
        'Date',
        'Fri, 13 Jan 2023 14:28:10 GMT',
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
