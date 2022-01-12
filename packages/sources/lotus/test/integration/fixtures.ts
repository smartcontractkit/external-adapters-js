import nock from 'nock'

export const mockLotusResponseSuccess = (): nock =>
  nock('http://127.0.0.1:1234', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: 'Bearer test_api_key',
    },
  })
    .persist()
    .post('/rpc/v0', {
      id: 1,
      jsonrpc: '2.0',
      method: 'Filecoin.WalletBalance',
      params: ['f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi'],
    })
    .reply(200, { jsonrpc: '2.0', result: '33426744125000000000000', id: 1 }, [
      'Date',
      'Wed, 22 Sep 2021 14:38:41 GMT',
      'Content-Length',
      '60',
      'Content-Type',
      'text/plain; charset=utf-8',
      'Connection',
      'close',
    ])
    .post('/rpc/v0', {
      id: 2,
      jsonrpc: '2.0',
      method: 'Filecoin.WalletBalance',
      params: ['f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay'],
    })
    .reply(200, { jsonrpc: '2.0', result: '850000000000000000', id: 2 }, [
      'Date',
      'Wed, 22 Sep 2021 14:38:42 GMT',
      'Content-Length',
      '55',
      'Content-Type',
      'text/plain; charset=utf-8',
      'Connection',
      'close',
    ])
