import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as crypto from 'crypto'
import nock from 'nock'
import { createFixtures, MOCK_DATE } from './fixtures'

const TEST_API_HOST = 'http://test-infralabs.local'
const TEST_API_PATH = '/index'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let fixtures: ReturnType<typeof createFixtures>
  let rotatedFixtures: ReturnType<typeof createFixtures>

  jest.setTimeout(10000)

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const rotated = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })

    fixtures = createFixtures(privateKey)
    rotatedFixtures = createFixtures(rotated.privateKey)

    const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' })
    const rotatedPublicKeyPem = rotated.publicKey.export({ format: 'pem', type: 'spki' })

    process.env['API_KEY'] = 'test-api-key'
    process.env['USHP_API_ENDPOINT'] = `${TEST_API_HOST}${TEST_API_PATH}`
    process.env['USHP_MAX_STALENESS_SECS'] = '90000'
    // Two keys configured at once, as during a zero-downtime rotation window.
    process.env['INFRALABS_PUBLIC_KEYS'] = JSON.stringify([publicKeyPem, rotatedPublicKeyPem])
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

    it('should return a rescaled result when signed with a rotated (second configured) key', async () => {
      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, rotatedFixtures.success)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(200)
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

    it('should return 502 when no configured key matches the signature', async () => {
      const { privateKey: unrelatedPrivateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'P-256',
      })
      const unrelatedFixtures = createFixtures(unrelatedPrivateKey)

      nock(TEST_API_HOST).get(TEST_API_PATH).reply(200, unrelatedFixtures.success)

      const response = await testAdapter.request({ endpoint: 'ushp' })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
