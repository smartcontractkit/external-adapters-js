import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Entity%202%20Deal/DEAL-ENTITY2-EXAMPLE')
    .reply(
      200,
      () => ({
        insuredAmount: 1000000,
        currentExposure: 500000,
        timestamp: '2026-02-09T00:00:00Z',
        daysRemaining: 42,
        signature: '0xabc123def456',
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

export const mockResponseSuccessAnotherDeal = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Another%20Deal/DEAL-ANOTHER-123')
    .reply(
      200,
      () => ({
        insuredAmount: 2500000,
        currentExposure: 1200000,
        timestamp: '2025-06-15T12:00:00Z',
        daysRemaining: 180,
        signature: '0xdef789ghi012',
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

export const mockResponseSuccessSpecialChars = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Deal%20%26%20Company/DEAL-SPECIAL%2FTEST')
    .reply(
      200,
      () => ({
        insuredAmount: 500000,
        currentExposure: 250000,
        timestamp: '2025-03-01T00:00:00Z',
        daysRemaining: 90,
        signature: '0x123abc456def',
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

export const mockResponseSuccessZeroDays = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Expired%20Deal/DEAL-EXPIRED')
    .reply(
      200,
      () => ({
        insuredAmount: 100000,
        currentExposure: 0,
        timestamp: '2024-01-01T00:00:00Z',
        daysRemaining: 0,
        signature: '0xexpired000',
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

export const mockResponseFailure500 = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Error%20Deal/DEAL-ERROR')
    .reply(500, { error: 'Internal Server Error' })
    .persist()

export const mockResponseFailure404 = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/NotFound%20Deal/DEAL-NOTFOUND')
    .reply(404, { error: 'Deal not found' })
    .persist()

export const mockResponseFailure401 = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Unauthorized%20Deal/DEAL-UNAUTHORIZED')
    .reply(401, { error: 'Unauthorized' })
    .persist()

export const mockResponseEmptyBody = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Empty%20Deal/DEAL-EMPTY')
    .reply(200, null)
    .persist()
