import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://ETHEREUM_CL_INDEXER_URL', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      credentials: ['1'],
    })
    .reply(
      200,
      () => [
        {
          withdrawalCredential: '1',
          totalBeaconBalance: '100',
          totalLimboBalance: '200',
          totalBalance: '300',
          isValid: true,
        },
      ],
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
  nock('http://ETHEREUM_CL_INDEXER_URL', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      credentials: ['2'],
    })
    .reply(
      200,
      () => [
        {
          withdrawalCredential: '2',
          totalBeaconBalance: '1000',
          totalLimboBalance: '2000',
          totalBalance: '3000',
          isValid: false,
        },
      ],
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
