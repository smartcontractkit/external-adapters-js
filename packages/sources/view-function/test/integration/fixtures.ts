import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545', {
    encodedQueryParams: true,
  })
    .persist()
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
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdac17f958d2ee523a2206206994597c13d831ec7' &&
            request.params[0].data === '0x95d89b41'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result:
                '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000', // Mocked result for eth_call
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
