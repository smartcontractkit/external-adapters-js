import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { setEnvVariables } from '@chainlink/ea-test-helpers'
import { AddressInfo } from 'net'
import * as nock from 'nock'
import * as process from 'process'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'

describe('execute - validation errors', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'

    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    if (process.env.RECORD) {
      nock.recorder.play()
    }
  })

  beforeEach(async () => {
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    fastify.close(done)
  })

  describe('missing required parameters', () => {
    it('should return error when network is missing', async () => {
      const data: AdapterRequest = {
        id,
        data: {},
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.status).toBe('errored')
      expect(response.body.error).toBeDefined()
      expect(response.body).toMatchSnapshot()
    })

    it('should return error when data is empty', async () => {
      const data: AdapterRequest = {
        id,
        data: {},
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.status).toBe('errored')
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('invalid parameter values', () => {
    it('should return error for invalid network value', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          network: 'invalid-network',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.status).toBe('errored')
      expect(response.body.error).toBeDefined()
      expect(response.body).toMatchSnapshot()
    })

    it('should return error for empty network value', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          network: '',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.status).toBe('errored')
      expect(response.body.error).toBeDefined()
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('invalid request format', () => {
    it('should handle request with no id', async () => {
      const data = {
        data: {
          network: 'arbitrum',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

      // Should either succeed with default id or return appropriate error
      expect(response.body).toBeDefined()
      expect(response.body).toMatchSnapshot()
    })
  })
})
