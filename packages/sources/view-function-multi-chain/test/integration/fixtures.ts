import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockETHMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }),
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
    .persist()
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000005ad789f8',
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
    .persist()
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c',
          data: '0xb5ab58dc0000000000000000000000000000000000000000000000060000000000001df4',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000005cf7ff3b',
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
    .persist()

export const mockETHGoerliContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8554', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({ jsonrpc: '2.0', id: request['id'], result: '0x5' }),
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
    .persist()
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x779877a7b0d9e8603169ddbd7836e478b4624789', data: '0x50d25bcd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000eead809f678d30f0',
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
