import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://chainlink.orchid.com/', {
    encodedQueryParams: true,
  })
    .get('/0')
    .reply(
      200,
      () => 0.06491712005868807976150333365786842895233705955274720070639730258746548395,
      [
        'Content-Type',
        'text/plain',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
