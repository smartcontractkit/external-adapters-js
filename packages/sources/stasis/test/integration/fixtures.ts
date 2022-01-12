import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://stasis.net', {
    encodedQueryParams: true,
  })
    .get('/transparency/eurs-statement')
    .reply(200, (_, request) => ({ amount: '89225940.00' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
