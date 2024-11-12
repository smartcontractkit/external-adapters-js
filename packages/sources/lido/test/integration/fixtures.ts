import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export function mockStmaticSuccess(): void {
  nock('https://test-rpc-url:443', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request['id'], result: '0x89' }),
      [
        'content-type',
        'application/json',
        'vary',
        'Origin',
        'date',
        'Mon, 16 May 2022 20:45:07 GMT',
        'content-length',
        '42',
        'x-envoy-upstream-service-time',
        '25',
        'x-cluster',
        'Chainlink Matic',
        'server',
        'envoy',
        'connection',
        'close',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0xded6c522d803e35f65318a9a4d7333a22d582199', data: '0x679aefce' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000e171057abb3eb0e',
      }),
      [
        'content-type',
        'application/json',
        'vary',
        'Origin',
        'date',
        'Mon, 16 May 2022 20:45:09 GMT',
        'content-length',
        '104',
        'x-envoy-upstream-service-time',
        '26',
        'x-cluster',
        'Chainlink Matic',
        'server',
        'envoy',
        'connection',
        'close',
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
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000004125cc7',
      }),
      [
        'content-type',
        'application/json',
        'vary',
        'Origin',
        'date',
        'Mon, 16 May 2022 20:45:09 GMT',
        'content-length',
        '104',
        'x-envoy-upstream-service-time',
        '26',
        'x-cluster',
        'Chainlink Matic',
        'server',
        'envoy',
        'connection',
        'close',
      ],
    )
}
