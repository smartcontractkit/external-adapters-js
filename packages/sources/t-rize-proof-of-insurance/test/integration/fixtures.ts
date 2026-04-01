import nock from 'nock'

const MERKLE_PATH = '/v1/asset-verifier/merkle-tree/current-root'
const BASE_URL = 'https://proof.t-rize.network'

const OWNER_PARTY_ID =
  'TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

const POSITIVE_INT192_MAX_HEX = `7f${'ff'.repeat(23)}`
const POSITIVE_INT192_SAFE_HEX = `7f${'00'.repeat(23)}`
const POSITIVE_INT192_OVERFLOW_HEX = 'ff'.repeat(24)
const POSITIVE_INT192_MAX_ROOT = Buffer.from(POSITIVE_INT192_MAX_HEX, 'hex').toString('base64')
const POSITIVE_INT192_SAFE_ROOT = Buffer.from(POSITIVE_INT192_SAFE_HEX, 'hex').toString('base64')
const POSITIVE_INT192_OVERFLOW_ROOT = Buffer.concat([
  Buffer.from(POSITIVE_INT192_OVERFLOW_HEX, 'hex'),
  Buffer.alloc(8),
]).toString('base64')

export const POSITIVE_INT192_MAX_DECIMAL = BigInt(`0x${POSITIVE_INT192_MAX_HEX}`).toString()

const RESPONSE_HEADERS = [
  'Content-Type',
  'application/json',
  'Connection',
  'close',
  'Vary',
  'Accept-Encoding',
  'Vary',
  'Origin',
]

export const mockResponseSuccess = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: OWNER_PARTY_ID,
      tree_id: 'tree-001',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-001',
        root: 'DiPv1Gh+kZXNRkqT7m+xdfzR3tUzafs5BnBqa2/dI3c=',
        contractId:
          '0098c817c75cc13375800e505d4b8e393a3e479ff7c7851e9378c676877ca37876ca1212208efc2905ca21b67b9ce3528a2f7b26394a9fb417eef1938890c2990449f0b698',
        computedAt: '2026-03-10T13:06:18Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseSuccessAnotherTree = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: OWNER_PARTY_ID,
      tree_id: 'tree-002',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-002',
        root: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        contractId: 'ff',
        computedAt: '2025-06-15T12:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseSuccessSpecialChars = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'owner::with-special/chars',
      tree_id: 'tree & test',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-003',
        root: '/////////////////////w==',
        contractId: '01',
        computedAt: '2025-03-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseSuccessMinimalRoot = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'minimal-owner',
      tree_id: 'tree-minimal',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-004',
        root: 'AQ==',
        contractId: '00',
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseSuccessPositiveInt192Boundary = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'boundary-owner',
      tree_id: 'tree-boundary',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-boundary',
        root: POSITIVE_INT192_MAX_ROOT,
        contractId: POSITIVE_INT192_MAX_HEX,
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseInvalidComputedAt = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'invalid-time-owner',
      tree_id: 'tree-invalid-time',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-invalid-time',
        root: POSITIVE_INT192_SAFE_ROOT,
        contractId: POSITIVE_INT192_SAFE_HEX,
        computedAt: 'not-a-date',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseOverflowRootAfterTruncation = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'overflow-root-owner',
      tree_id: 'tree-overflow-root-truncated',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-overflow-root-truncated',
        root: POSITIVE_INT192_OVERFLOW_ROOT,
        contractId: POSITIVE_INT192_SAFE_HEX,
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseOverflowContractAfterTruncation = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'overflow-contract-owner',
      tree_id: 'tree-overflow-contract-truncated',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-overflow-contract-truncated',
        root: POSITIVE_INT192_SAFE_ROOT,
        contractId: `${POSITIVE_INT192_OVERFLOW_HEX}${'00'.repeat(8)}`,
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseFailure500 = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'error-owner',
      tree_id: 'tree-error',
    })
    .reply(500, { error: 'Internal Server Error' })
    .persist()

export const mockResponseFailure404 = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'notfound-owner',
      tree_id: 'tree-notfound',
    })
    .reply(404, { error: 'Contract not found' })
    .persist()

export const mockResponseFailure401 = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'unauthorized-owner',
      tree_id: 'tree-unauthorized',
    })
    .reply(401, { error: 'Unauthorized' })
    .persist()

export const mockResponseEmptyBody = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'empty-owner',
      tree_id: 'tree-empty',
    })
    .reply(200)
    .persist()
