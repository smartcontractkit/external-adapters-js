import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

export const mockETHMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
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
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            // balanceOf(0x3A29CD3052774224E7C2CF001254211C986967B2)
            request.method === 'eth_call' &&
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000003a29cd3052774224e7c2cf001254211c986967b2'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x000000000000000000000000000000000000000000000000000000000029e6cd', // 2746061
            }
          } else if (
            // balanceOf(0x3d9bCcA8Bc7D438a4c5171435f41a0AF5d5E6083)
            request.method === 'eth_call' &&
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000003d9bcca8bc7d438a4c5171435f41a0af5d5e6083'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000006e926d9', // 115943129
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

export const mockBASEMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-base-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x2105',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            // balanceOf(0x1fCca65fb6Ae3b2758b9b2B394CB227eAE404e1E)
            request.method === 'eth_call' &&
            request.params[0].to === '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000001fcca65fb6ae3b2758b9b2b394cb227eae404e1e'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x00000000000000000000000000000000000000000000000000000000046ab089', // 74100873
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
