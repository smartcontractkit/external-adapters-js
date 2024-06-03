import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockStarknetSepoliaContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .persist()
    .post('/', {
      id: /^\d+$/,
      jsonrpc: '2.0',
      method: 'starknet_call',
      params: {
        request: {
          contract_address: '0x013584125fb2245fab8179e767f2c393f74f7370ddc2748aaa422f846cc760e4',
          entry_point_selector: '0x3934bf435e1b98555ff170fde2c4b1ed8116018f1aa953022c2b6f54d4bfaab',
          calldata: [],
        },
        block_id: 'pending',
      },
    })
    .reply(
      200,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: [
          '0x10000000000000000000000000000a7fb',
          '0x5f54c90',
          '0x1121f',
          '0x6658b349',
          '0x6658b23b',
        ],
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
      id: /^\d+$/,
      jsonrpc: '2.0',
      method: 'starknet_call',
      params: {
        request: {
          contract_address: '0x013584125fb2245fab8179e767f2c393f74f7370ddc2748aaa422f846cc76',
          entry_point_selector: '0x3934bf435e1b98555ff170fde2c4b1ed8116018f1aa953022c2b6f54d4bfaab',
          calldata: [],
        },
        block_id: 'pending',
      },
    })
    .reply(
      502,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        error: {
          code: 20,
          message: 'Contract not found',
        },
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
      id: /^\d+$/,
      jsonrpc: '2.0',
      method: 'starknet_call',
      params: {
        request: {
          contract_address: '0x036031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a',
          entry_point_selector: '0x3934bf435e1b98555ff170fde2c4b1ed8116018f1aa953022c2b6f54d4bfaab',
          calldata: [],
        },
        block_id: 'pending',
      },
    })
    .reply(
      502,
      (_, request: JsonRpcPayload) => ({
        jsonrpc: '2.0',
        id: request['id'],
        error: {
          code: -32603,
          message: 'Internal error',
          data: {
            error: 'Invalid message selector',
          },
        },
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
