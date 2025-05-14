import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: {
    to: string
    data: string
  }[]
  jsonrpc: '2.0'
}

export const mockETHMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        // Create an array of mocked responses for each batched request
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x1',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c' &&
            request.params[0].data === '0x50d25bcd'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x000000000000000000000000000000000000000000000000000000005ad789f8',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0x2c1d072e956affc0d435cb7ac38ef18d24d9127c' &&
            request.params[0].data ===
              '0xb5ab58dc0000000000000000000000000000000000000000000000060000000000001df4'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x000000000000000000000000000000000000000000000000000000005cf7ff3b',
            }
          } else {
            // Default response for unsupported calls
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' },
            }
          }
        })
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
    .persist()

export const mockETHGoerliContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8554', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        // Create an array of mocked responses for each batched request
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x5',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0x779877a7b0d9e8603169ddbd7836e478b4624789' &&
            request.params[0].data === '0x50d25bcd'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x000000000000000000000000000000000000000000000000eead809f678d30f0',
            }
          } else {
            // Default response for unsupported calls
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' },
            }
          }
        })
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
    .persist()

export const mockAptosSuccess = (): nock.Scope =>
  nock('http://fake-aptos', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/view')
    .reply(200, () => [1], [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockAptosDfReaderSuccess = (): nock.Scope =>
  nock('http://fake-aptos-testnet', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/view')
    .reply(
      200,
      () => [
        [
          {
            feed: {
              benchmark: '10568348893862534',
              config_id: '0x',
              description: 'truAPT-APT Exchange Rate',
              observation_timestamp: '1747197639',
              report:
                '0x00030b04d917b020da9373073eebdf46a804972050dc1c28f6fb4e9975e84e700000000000000000000000000000000000000000000000000000000068241cfe0000000000000000000000000000000000000000000000000000000068241ec700000000000000007fffffffffffffffffffffffffffffffffffffffffffffff00000000000000007fffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000006825704700000000000000000000000000000000000000000000000000258bdb79ae5a8600000000000000000000000000000000000000000000000000258bdb79ae5a8600000000000000000000000000000000000000000000000000258bdb79ae5a86',
            },
            feed_id: '0x015d2ae47f000328000000000000000000000000000000000000000000000000',
          },
          {
            feed: {
              benchmark: '1025605000000',
              config_id: '0x',
              description: 'eAPT-APT Exchange Rate',
              observation_timestamp: '1747158560',
              report:
                '0x00030b04d917b020da9373073eebdf46a804972050dc1c28f6fb4e9975e84e71000000000000000000000000000000000000000000000000000000006823861c000000000000000000000000000000000000000000000000000000006823862000000000000000007fffffffffffffffffffffffffffffffffffffffffffffff00000000000000007fffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000006824d7a0000000000000000000000000000000000000000000000000000000eecad25b40000000000000000000000000000000000000000000000000000000eecad25b40000000000000000000000000000000000000000000000000000000eecad25b40',
            },
            feed_id: '0x017b2eb719000326000000000000000000000000000000000000000000000000',
          },
        ],
      ],
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
