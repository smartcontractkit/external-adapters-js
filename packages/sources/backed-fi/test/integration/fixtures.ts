import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.backed.fi/api/v1/token', {
    encodedQueryParams: true,
  })
    .get('/METAx/multiplier')
    .query({ network: 'Arbitrum' })
    .reply(
      200,
      () => ({
        activationDateTime: 0,
        currentMultiplier: 1,
        newMultiplier: 0,
        reason: null,
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
  nock('https://api.backed.fi/api/v1/token', {
    encodedQueryParams: true,
  })
    .get('/METAx/multiplier?network=Ethereum')
    .reply(
      200,
      () => ({
        error: 'Something went wrong',
        message: "Cannot read properties of undefined (reading 'multiplier')",
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
