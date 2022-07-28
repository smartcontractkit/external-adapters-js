import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export function mockResponseSuccess(): nock.Scope {
  return nock('https://test-rpc-url:8545', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request['id'], result: '0x2a' }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x0123456789abcdef0123456789abcdef01234567',
          data: '0xcd481a1900000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000007426974636f696e00000000000000000000000000000000000000000000000000',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002a626331713467777830663679717572713067776a396b74776c6576727033657538736e6e356b6161617800000000000000000000000000000000000000000000',
        id: request['id'],
      }),
      [],
    )
}
