import nock from 'nock'

export function mockStKsmSuccess(): void {
  nock('https://test-rpc-url', { encodedQueryParams: true })
    .persist()
    .post('/', { method: 'eth_chainId', params: [], id: /^\d+$/, jsonrpc: '2.0' })
    .reply(200, (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1285' }), [
      'Content-Type',
      'application/json',
      'Accept-Encoding',
      'gzip, deflate',
      'accept',
      '*/*',
      'content-length',
      '20',
    ])
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B', data: '0xfeaf968c' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000000018E8ED5FA',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B', data: '0x313ce567' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000000000000000008',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x77D4b212770A7cA26ee70b1E0f27fC36da191c53', data: '0xe25aa5fa' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000000000000DE401DFFF3129BC',
      }),
      [
        'Content-Type',
        'application/json',
        'Accept-Encoding',
        'gzip, deflate',
        'accept',
        '*/*',
        'content-length',
        '20',
      ],
    )
}
