import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://open-api.ceffu.com')
    .get('/open-api/v1/mirrorX/positions/list')
    .query(true)
    .reply(200, () => ({ data: { exchangeBalance: '100.0' }, code: '123', message: 'ok' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
