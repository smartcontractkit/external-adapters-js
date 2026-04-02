import nock from 'nock'

const MERKLE_PATH = '/v1/asset-verifier/merkle-tree/current-root'
const BASE_URL = 'https://proof.t-rize.network'

const OWNER_PARTY_ID =
  'TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

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

export const mockResponseSuccessFlexibleEncoding = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'normalized-owner',
      tree_id: 'tree-normalized',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-normalized',
        root: 'AQ',
        contractId: '0XAbCd',
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseSuccessSignBitRoot = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'sign-bit-owner',
      tree_id: 'tree-sign-bit',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-sign-bit',
        root: '////////////////////////////////AAAAAAAAAAA=',
        contractId: 'ffffffffffffffffffffffffffffffffffffffffffffffff',
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
        root: 'AQ==',
        contractId: '00',
        computedAt: 'not-a-date',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseInvalidRoot = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'invalid-root-owner',
      tree_id: 'tree-invalid-root',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-invalid-root',
        root: '!not-base64!',
        contractId: '00',
        computedAt: '2024-01-01T00:00:00Z',
      }),
      RESPONSE_HEADERS,
    )
    .persist()

export const mockResponseInvalidContractId = (): nock.Scope =>
  nock(BASE_URL, { encodedQueryParams: true })
    .get(MERKLE_PATH)
    .query({
      owner_party_id: 'invalid-contract-owner',
      tree_id: 'tree-invalid-contract',
    })
    .reply(
      200,
      () => ({
        treeId: 'tree-invalid-contract',
        root: 'AQ==',
        contractId: 'xyz123',
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
