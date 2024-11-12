import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545')
    .persist()
    .post('/', {
      method: 'eth_getBalance',
      params: ['0xef9ffcfbecb6213e5903529c8457b6f61141140d', 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x2fe84e3113d7b',
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
