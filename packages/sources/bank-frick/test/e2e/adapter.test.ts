import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    fastify.close(done)
  })

  describe('test /accounts', () => {
    const validData: AdapterRequest = {
      id,
      data: {
        ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
      },
    }

    it('should return success', async () => {
      const response = await req
        .post('/')
        .send(validData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.result).toBeGreaterThan(0)
    })

    it('should return 404 because account not found', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          ibanIDs: ['LI999999999ZZZZZZZZ'],
        },
      }
      await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
    })
  })
})
