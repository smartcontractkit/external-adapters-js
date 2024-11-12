import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { generateKeyPair } from 'crypto'
import { server as startServer } from '../../src'
import { mockSnowflakeResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

async function generatePrivateKey(): Promise<string> {
  return new Promise((resolve) => {
    generateKeyPair(
      'rsa',
      {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (_, __, privateKey) => {
        resolve(privateKey)
      },
    )
  })
}

beforeAll(async () => {
  process.env.PRIVATE_KEY = process.env.PRIVATE_KEY ?? (await generatePrivateKey())
})

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    ACCOUNT: process.env.ACCOUNT ?? 'test_account',
    DB_USERNAME: process.env.DB_USERNAME ?? 'test_db_username',
    DATABASE: process.env.DATABASE ?? 'test_database',
    SCHEMA: process.env.SCHEMA ?? 'test_schema',
    CLOUD_REGION: process.env.CLOUD_REGION ?? 'test_region',
    CLOUD_PROVIDER: process.env.CLOUD_PROVIDER ?? 'test_provider',
    API_VERBOSE: true as unknown as string,
  }

  setupExternalAdapterTest(envVariables, context)

  describe('basic', () => {
    const data: AdapterRequest = {
      id,
      data: {
        state: 'Alabama',
        county: 'Autauga',
      },
    }

    it('should return success', async () => {
      mockSnowflakeResponse()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
