import nock from 'nock'

const API_ENDPOINT = 'https://staging-mint-5ylweigmlq-el.a.run.app'

export const mockResponseSuccess = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .get('/nav')
    .reply(
      200,
      () => ({
        accountName: 'SYNTHESYS',
        NAV: '146.51',
        updatedAt: '2026-02-24T02:04:50.593Z',
        ripcord: false,
        ripcordDetails: [],
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
    .persist()

export const mockResponseServerError = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .get('/nav')
    .reply(500, { error: 'Internal Server Error' }, [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
    ])
    .persist()
