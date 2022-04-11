import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://stasis.net', {
    encodedQueryParams: true,
  })
    .get('/transparency/eurs-statement')
    .reply(
      200,
      (_, request) => ({
        accounts: {
          nexpay: { amount: '2742801.19' },
          xnt: { amount: '85162500.00' },
          ext: { amount: '29864028.69' },
        },
        summary: { amount: '117769329.88' },
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
