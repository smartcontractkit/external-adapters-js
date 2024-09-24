import nock from 'nock'

export const mockResponse = (): nock.Scope =>
  nock('https://serenitybank.io/stablecoin', {
    encodedQueryParams: true,
  })
    .get('/USDFB/audit')
    .query({})
    .reply(
      200,
      () => ({
        accountName: 'USDFB',
        ripcord: false,
        ripcordDetails: [],
        timestamp: '2024-09-19T18:42:27.653767Z',
        totalReserve: 2000000,
        totalToken: 0,
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
    .get('/NO_RESERVE/audit')
    .query({})
    .reply(
      200,
      () => ({
        accountName: 'NO_RESERVE',
        ripcord: false,
        ripcordDetails: [],
        timestamp: '2024-09-19T18:42:27.653767Z',
        totalToken: 0,
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
