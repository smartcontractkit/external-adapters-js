import nock from 'nock'

export const mockContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8545')
    .post('/')
    .reply(
      200,
      (_, request) => ({ jsonrpc: '2.0', id: request['id'], result: '1065508199231399700' }),
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
