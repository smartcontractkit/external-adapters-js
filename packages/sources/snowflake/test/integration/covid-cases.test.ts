import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { generateKeyPair } from 'crypto'
import { server as startServer } from '../../src'
import { mockSnowflakeResponse } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

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
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'

  process.env.ACCOUNT = process.env.ACCOUNT ?? 'test_account'
  process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'test_db_username'
  process.env.DATABASE = process.env.DATABASE ?? 'test_database'
  process.env.SCHEMA = process.env.SCHEMA ?? 'test_schema'
  process.env.CLOUD_REGION = process.env.CLOUD_REGION ?? 'test_region'
  process.env.CLOUD_PROVIDER = process.env.CLOUD_PROVIDER ?? 'test_provider'
  process.env.PRIVATE_KEY = process.env.PRIVATE_KEY ?? (await generatePrivateKey())

  process.env.API_VERBOSE = true as unknown as string

  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.CACHE_ENABLED = 'false'
  })

  afterAll((done) => {
    server.close(done)
  })

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

      const response = await req
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
