import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockAccountsSuccess, mockAuthorizeSuccess } from './fixtures'
import {} from '../../src/endpoint'
import type { TInputParameters as AccountInputParameters } from '../../src/endpoint/accounts'
import { generateJWT } from '../../dist/endpoint/accounts'
import { makeConfig } from '../../dist/config'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  sign: jest.fn(() => 'SIGNATURE'),
}))

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.API_KEY = 'SOME_API_KEY'
    process.env.PRIVATE_KEY = 'SOME_PRIVATE_KEY'
    process.env.PASSWORD = 'SOME_PASSWORD'
    process.env.CACHE_ENABLED = 'false'
    process.env.ALLOW_INSECURE = 'true'
    process.env.NODE_ENV = 'development'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    jest.clearAllMocks()
    process.env = oldEnv

    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('accounts', () => {
    it('successful authorization', async () => {
      const config = makeConfig()
      mockAuthorizeSuccess()
      const token = await generateJWT(config)
      expect(token).toEqual('SOME_TOKEN')
    })

    it('successful request', async () => {
      const data: AdapterRequest<AccountInputParameters> = {
        id,
        data: {
          ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
        },
      }
      mockAuthorizeSuccess()
      mockAccountsSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('account not found', async () => {
      const data = {
        id,
        data: {
          ibanIDs: ['LI0000000000000000000'],
        },
      }
      mockAccountsSuccess() //We are able to find accounts, BUT, the one we want isn't there
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
      expect(response.body).toMatchSnapshot({
        //We care that the error is there, but don't want to match on content since the stack and message can change between runs
        error: expect.any(Object),
      })
    })
  })
})
