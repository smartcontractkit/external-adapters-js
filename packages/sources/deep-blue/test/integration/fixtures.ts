import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://d0qqxbypoa.execute-api.ap-southeast-2.amazonaws.com', {
    encodedQueryParams: true,
  })
    .get('/feed')
    .query({})
    .reply(
      200,
      () => ({
        accountName: 'DBUSD',
        totalReserve: 500000,
        timestamp: '2024-08-07T15:11:59.554Z',
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

export const mockResponseFailure = (): nock.Scope =>
  nock('https://d0qqxbypoa.execute-api.ap-southeast-2.amazonaws.com', {
    encodedQueryParams: true,
  })
    .get('/feed')
    .query({})
    .reply(
      200,
      () => ({
        accountName: 'DBUSD',
        totalReserve: 500000,
        timestamp: '2024-08-07T15:11:59.554Z',
        ripcord: true,
        ripcordDetails: ['Require Balance Check'],
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
