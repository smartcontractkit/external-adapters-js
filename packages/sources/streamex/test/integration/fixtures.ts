import nock from 'nock'

export const mockReserveResponseSuccess = (): nock.Scope =>
  nock('https://data.streamex.com/prod/chainlink', {
    encodedQueryParams: true,
  })
    .get('/gldy-status')
    .reply(200, {
      accountName: 'GLDY',
      totalReserve: 23923,
      timestamp: '2025-10-16T03:01:41.362Z',
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockReserveResponseRipcordFailure = (): nock.Scope =>
  nock('https://data.streamex.com/prod/chainlink', {
    encodedQueryParams: true,
  })
    .get('/gldy-status')
    .reply(200, {
      accountName: 'GLDY',
      totalReserve: 23923,
      timestamp: '2025-10-16T03:01:41.362Z',
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()
