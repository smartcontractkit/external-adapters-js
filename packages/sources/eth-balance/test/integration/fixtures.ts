import nock from 'nock'

/* eslint-disable @typescript-eslint/no-explicit-any */
type JsonRpcPayload = {
  id: number
  method: string
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockETHBalanceResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x1',
            }
          } else if (request.method === 'eth_blockNumber') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0xddae3f',
            }
          } else if (
            request.method === 'eth_getBalance' &&
            request.params[0] === '0xef9ffcfbecb6213e5903529c8457b6f61141140d' &&
            request.params[1] === 'latest'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x2fe84e3113d7b',
            }
          } else if (
            request.method === 'eth_getBalance' &&
            request.params[0] === '0x6a1544f72a2a275715e8d5924e6d8a017f0e41ed' &&
            request.params[1] === 'latest'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x164451e4741c3ada', // 2746061
            }
          } else if (
            request.method === 'eth_getBalance' &&
            request.params[0] === '0x6a1544f72a2a275715e8d5924e6d8a017f0e41ed' &&
            request.params[1] === '0xddae2b'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x37ad4e2c14e7e0',
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
