import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockPunksValueResponseSuccess, mockCollectionsValueResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.API_KEY = 'test-key'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('punk valuation api', () => {
    const punkData: AdapterRequest = {
      id,
      data: {
        block: 14000000,
        endpoint: 'punks',
      },
    }

    it('should return success', async () => {
      mockPunksValueResponseSuccess()

      const response = await req
        .post('/')
        .send(punkData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('collections valuation api', () => {
    const collectionData: AdapterRequest = {
      id,
      data: {
        endpoint: 'collections',
        collection: 'jpeg-cards',
      },
    }

    it('should return success', async () => {
      mockCollectionsValueResponseSuccess()

      const response = await req
        .post('/')
        .send(collectionData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
