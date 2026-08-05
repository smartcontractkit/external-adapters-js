import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as crypto from 'crypto'
import nock from 'nock'
import { createFixtures, MOCK_DATE, TEST_KEY_ID } from './fixtures'

const TEST_API_HOST = 'http://test-infralabs.local'
const TEST_API_PATH = '/index'

const mockKmsSend = jest.fn()

jest.mock('@aws-sdk/client-kms', () => ({
  ...jest.requireActual('@aws-sdk/client-kms'),
  KMSClient: jest.fn().mockImplementation(() => ({
    send: mockKmsSend,
  })),
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let fixtures: ReturnType<typeof createFixtures>
  let publicKeyDer: Buffer

  jest.setTimeout(10000)

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    publicKeyDer = publicKey.export({ format: 'der', type: 'spki' }) as Buffer

    fixtures = createFixtures(privateKey)

    mockKmsSend.mockImplementation(
      async (command: { constructor: { name: string }; input: { KeyId: string } }) => {
        if (command.constructor.name === 'GetPublicKeyCommand') {
          if (command.input.KeyId === TEST_KEY_ID) {
            return { PublicKey: new Uint8Array(publicKeyDer) }
          }
          throw new Error(`KMS unavailable for key: ${command.input.KeyId}`)
        }
      },
    )

    process.env['API_KEY'] = 'test-api-key'
    process.env['USHP_API_ENDPOINT'] = `${TEST_API_HOST}${TEST_API_PATH}`
    process.env['USHP_MAX_STALENESS_SECS'] = '90000'
    process.env['BACKGROUND_EXECUTE_MS'] = '1000'
    process.env['KMS_KEY_TTL_MS'] = '60000'
    process.env['KMS_REGION'] = 'us-east-1'
    process.env['AWS_ACCESS_KEY_ID'] = 'test-access-key-id'
    process.env['AWS_SECRET_ACCESS_KEY'] = 'test-secret-access-key'
    process.env['KMS_VERIFICATION_DISABLED'] = 'false'
    process.env['METRICS_ENABLED'] = 'false'

    spy = jest.spyOn(Date, 'now').mockReturnValue(MOCK_DATE.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
    nock.cleanAll()
    jest.clearAllMocks()
  })

  beforeEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
  })

  describe('ushp endpoint', () => {
    it('should return a rescaled result for a valid response', async () => {
      nock(TEST_API_HOST)
        .get(TEST_API_PATH)
        .matchHeader('authorization', 'ApiKey test-api-key')
        .reply(200, fixtures.success)

      const response = await testAdapter.request({ endpoint: 'ushp' })
      const json = response.json()

      expect(response.statusCode).toBe(200)
      expect(typeof json.data?.signature).toBe('string')
      expect(json.data?.signature.length).toBeGreaterThan(0)
      const { signature: _sig, ...dataWithoutSignature } = json.data
      expect({ ...json, data: dataWithoutSignature }).toMatchSnapshot()
    })

    it('should return 502 when the price is stale', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.stale)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when the signature does not match the response body', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.badSig)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when KMS cannot return the public key', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.kmsUnavailable)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('KMS key caching', () => {
    // Each test advances the clock by 300 s from MOCK_DATE so any key cached by a previous
    // test (fetchedAt < current - 60 s) is always considered expired at the start of a new test.
    let timeOffset = 0

    beforeEach(() => {
      timeOffset += 300_000
      spy.mockReturnValue(MOCK_DATE.getTime() + timeOffset)
      mockKmsSend.mockClear()
      // Clear the response cache AFTER updating the clock so any response pre-populated
      // by the background handler at the old clock time is discarded.
      testAdapter.mockCache?.cache.clear()
    })

    it('should fetch the KMS key from AWS when the cache is cold or expired', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.success)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(200)
      expect(mockKmsSend).toHaveBeenCalledTimes(1)
    })

    it('should reuse the cached KMS key for subsequent requests within the TTL', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.success)
      await testAdapter.request({ endpoint: 'ushp' })
      mockKmsSend.mockClear()

      // Same clock value — key was just cached, still within 60 s TTL
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.success)
      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(200)
      expect(mockKmsSend).not.toHaveBeenCalled()
    })

    it('should re-fetch the KMS key after the 60 s TTL expires', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.success)
      await testAdapter.request({ endpoint: 'ushp' })
      expect(mockKmsSend).toHaveBeenCalledTimes(1)
      mockKmsSend.mockClear()

      // Advance another 61 s past the TTL from the current test's base time, then clear the
      // response cache so the next request re-triggers the background handler and re-checks the KMS TTL.
      spy.mockReturnValue(MOCK_DATE.getTime() + timeOffset + 61_000)
      testAdapter.mockCache?.cache.clear()

      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.success)
      await testAdapter.request({ endpoint: 'ushp' })

      expect(mockKmsSend).toHaveBeenCalledTimes(1)
    })

    it('should return 502 and call KMS twice when signature is invalid and AWS returns the same key', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, fixtures.badSig)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(502)
      // One call for getKmsPublicKey (cache expired) + one call for tryRefreshKmsKey
      expect(mockKmsSend).toHaveBeenCalledTimes(2)
      expect(response.json()).toMatchSnapshot()
    })

    it('should succeed after a key rotation when the refreshed key validates the signature', async () => {
      const rotatedKeys = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
      const rotatedPublicKeyDer = rotatedKeys.publicKey.export({
        type: 'spki',
        format: 'der',
      }) as Buffer
      const rotatedFixtures = createFixtures(rotatedKeys.privateKey)

      // First KMS call (getKmsPublicKey, cache expired) returns old key → sig check fails
      // Second KMS call (tryRefreshKmsKey) returns rotated key → cache updated → sig check passes
      mockKmsSend
        .mockResolvedValueOnce({ PublicKey: new Uint8Array(publicKeyDer) })
        .mockResolvedValueOnce({ PublicKey: new Uint8Array(rotatedPublicKeyDer) })

      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, rotatedFixtures.success)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(200)
      expect(mockKmsSend).toHaveBeenCalledTimes(2)
    })
  })
})
