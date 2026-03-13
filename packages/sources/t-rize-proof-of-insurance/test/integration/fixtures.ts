import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Entity%202%20Deal/DEAL-ENTITY2-EXAMPLE')
    .reply(
      200,
      () => ({
        treeId: 'tree-001',
        root: 'DiPv1Gh+kZXNRkqT7m+xdfzR3tUzafs5BnBqa2/dI3c=',
        contractId:
          '0098c817c75cc13375800e505d4b8e393a3e479ff7c7851e9378c676877ca37876ca1212208efc2905ca21b67b9ce3528a2f7b26394a9fb417eef1938890c2990449f0b698',
        computedAt: '2026-03-10T13:06:18Z',
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
        treeId: 'tree-002',
        root: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        contractId: 'ff',
        computedAt: '2025-06-15T12:00:00Z',
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
        treeId: 'tree-003',
        root: '/////////////////////w==',
        contractId: '01',
        computedAt: '2025-03-01T00:00:00Z',
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

export const mockResponseSuccessMinimalRoot = (): nock.Scope =>
  nock('https://proof.t-rize.io', {
    encodedQueryParams: true,
  })
    .get('/v1/chainlink/Minimal%20Deal/DEAL-MINIMAL')
    .reply(
      200,
      () => ({
        treeId: 'tree-004',
        root: 'AQ==',
        contractId: '00',
        computedAt: '2024-01-01T00:00:00Z',
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
