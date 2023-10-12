import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.harrisandtrotter.co.uk/api', {
    encodedQueryParams: true,
  })
    .get('/balances')
    .query({
      client_name: 'TUSD',
    })
    .reply(
      200,
      {
        accountName: 'TUSD',
        totalReserve: 999999.99,
        totalToken: 888888.88,
        timestamp: '2023-10-07T17:33:12.777Z',
        ripcord: false,
        ripcordDetails: {
          insufficient_balance: false,
          source_failure: false,
          external_intervention: false,
        },
      },
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
  nock('https://api.harrisandtrotter.co.uk/api', {
    encodedQueryParams: true,
  })
    .get('/balances')
    .query({
      client_name: 'TUSD',
    })
    .reply(
      200,
      {
        accountName: 'TUSD',
        totalReserve: 999999.99,
        totalToken: 888888.88,
        timestamp: '2023-10-07T17:33:12.777Z',
        ripcord: true,
        ripcordDetails: {
          insufficient_balance: true,
          source_failure: false,
          external_intervention: false,
        },
      },
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
