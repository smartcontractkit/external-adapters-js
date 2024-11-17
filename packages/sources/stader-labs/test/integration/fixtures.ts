import nock from 'nock'
import { AdapterRequest } from '../../../../core/bootstrap'

export const mockMaticXSuccess = (): nock.Scope =>
  nock('https://test-rpc-polygon-url:443', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request.id, result: '0x89' }),
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
      params: [{ to: '0xee652bbf72689aa59f0b8f981c9c90e2a8af8d8f', data: '0x679aefce' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request.id,
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
      (_, request: AdapterRequest) => ({
        id: request.id,
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
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request.id, result: '0xfa' }),
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
      params: [{ to: '0xf4766552d15ae4d256ad41b6cf2933482b0680dc', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request.id,
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
      (_, request: AdapterRequest) => ({
        id: request.id,
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

export const mockBNBxSuccess = (): nock.Scope =>
  nock('https://test-rpc-bsc-url:443', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: 42, jsonrpc: '2.0' })
    .reply(200, { jsonrpc: '2.0', id: 42, result: '0x38' }, [
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
          to: '0x3b961e83400d51e6e1af5c450d3c7d7b80588d28',
          data: '0xca0506e80000000000000000000000000000000000000000000000000de0b6b3a7640000',
        },
        'latest',
      ],
      id: 44,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 44,
        result: '0x0000000000000000000000000000000000000000000000000e78bb1b7261b5ff',
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
      params: [{ to: '0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee', data: '0x50d25bcd' }, 'latest'],
      id: 43,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      {
        jsonrpc: '2.0',
        id: 43,
        result: '0x0000000000000000000000000000000000000000000000000000000674dd5cf1',
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
