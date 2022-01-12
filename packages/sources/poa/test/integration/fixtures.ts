import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://gasprice.poa.network')
    .get('/')
    .reply(200, (_, request) => ({ average: 152.5, fast: 174.5, slow: 139.4 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
