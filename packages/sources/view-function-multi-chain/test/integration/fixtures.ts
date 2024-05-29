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

export const mockStarknetMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8560', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'starknet_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x534e5f4d41494e',
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
      // decimals
      params: [
        {
          to: '0x07c2e1e733f28daa23e78be3a4f6c724c0ab06af65f6a95b5e0545215f1abc1b',
          data: '0x4c4fb1ab068f6039d5780c68dd0fa2f8742cceb3426d19667778ca7f3518a9',
        },
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x12',
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
      // balanceOf
      params: [
        {
          to: '0x07c2e1e733f28daa23e78be3a4f6c724c0ab06af65f6a95b5e0545215f1abc1b',
          data: '0x35a73cd311a05d46deda634c5ee045db92f811b4e74bca4437fcb5302b7af33',
        },
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0',
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

export const mockStarknetSepoliaContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8506', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', { method: 'starknet_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x534e5f5345504f4c4941',
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
      // latest_round_data
      params: [
        {
          to: '0x228128e84cdfc51003505dd5733729e57f7d1f7e54da679474e73db4ecaad44',
          data: '0x3934bf435e1b98555ff170fde2c4b1ed8116018f1aa953022c2b6f54d4bfaab',
        },
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x10000000000000000000000000000a7fc',
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
      // round_data
      params: [
        {
          to: '0x228128e84cdfc51003505dd5733729e57f7d1f7e54da679474e73db4ecaad44',
          data: '0x273ba5642716a1849325412cb3b360aeb087c6cef3d8ee4bf25c42814248516',
        },
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x10000000000000000000000000000a7fc',
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
