import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
  jsonrpc: '2.0'
}

export const mockETHMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
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
      (_uri, requestBody: any[]) => {
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

export const mockETHContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x1',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000006',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data === '0xc5f24068' // getWithdrawalQueueLength()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000001',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data ===
              '0xf97832410000000000000000000000000000000000000000000000000000000000000000' // getWithdrawalQueueInfo()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result:
                '0x0000000000000000000000005eaff7af80488033bc845709806d5fae5291eb880000000000000000000000005eaff7af80488033bc845709806d5fae5291eb8800000000000000000000000000000000000000000000000000000000000f42401b0b9337a20c9ea4f3ead0a884adfd554439cfac8369c386e1feaab224fc90fc',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000005eaff7af80488033bc845709806d5fae5291eb88' // balanceOf()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x00000000000000000000000000000000000000000000000000002098639125aa',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xce9a6626eb99eaea829d7fa613d5d0a2eae45f40' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xce9a6626eb99eaea829d7fa613d5d0a2eae45f40' &&
            request.params[0].data === '0xfeaf968c' // latestRoundData()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result:
                '0x00000000000000000000000000000000000000000000000000000000000002f6000000000000000000000000000000000000000000000000000000000695299300000000000000000000000000000000000000000000000000000000683720cf00000000000000000000000000000000000000000000000000000000683720cf00000000000000000000000000000000000000000000000000000000000002f6',
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

export const mockXrplResponseSuccess = (): nock.Scope =>
  nock('http://localhost-xrpl:8080', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'account_lines',
      params: [
        {
          account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
          ledger_index: 'validated',
          peer: 'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
        },
      ],
    })
    .reply(
      200,
      {
        result: {
          account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
          ledger_hash: '1D08128C3E24093DCF18AE9E6800D795207320B3CAB8C1CD4F5C34F99107955D',
          ledger_index: 96115827,
          lines: [
            {
              account: 'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
              balance: '4663215.314987',
              currency: 'TBL',
              limit: '9999999999999999',
              limit_peer: '0',
              no_ripple: true,
              no_ripple_peer: false,
              peer_authorized: true,
              quality_in: 0,
              quality_out: 0,
            },
          ],
          status: 'success',
          validated: true,
        },
      },
      [
        'Date',
        'Wed, 14 May 2025 13:00:06 GMT',
        'Content-Type',
        'application/json; charset=UTF-8',
        'Content-Length',
        '444',
        'Connection',
        'keep-alive',
        'nel',
        '{"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}',
        'x-kong-upstream-latency',
        '3',
        'x-kong-proxy-latency',
        '1',
        'via',
        'kong/3.4.0',
        'cf-cache-status',
        'DYNAMIC',
        'report-to',
        '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=W2C1dDN5VsyGgu6eSLNm74YaGLBWjASjNyCy3BQVTxAgPjWM9LBCaxZtWqLWP7XitG%2B0rUqCxqWliq3G%2FkEL6u8JW6dnWy6nhLU3P8a9NNs0%2FF1PrYlnsyEsDqWa35qHikiBJsoIU1ZrZ3izVA%2FPLPMCdw%3D%3D"}]}',
        'cf-ray',
        '93fa939bcbb0fef1-PDX',
        'alt-svc',
        'h3=":443"; ma=86400',
        'x-rpc-provider',
        'simplyvc1',
      ],
    )
    .persist()
