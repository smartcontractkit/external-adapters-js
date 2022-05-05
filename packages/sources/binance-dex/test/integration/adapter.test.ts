import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockRateResponseFailure, mockRateResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
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

  describe('rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BUSD-BD1',
        quote: 'USDT-6D8',
      },
    }

    it('should return success', async () => {
      mockRateResponseSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    const dataWithOverride: AdapterRequest = {
      id,
      data: {
        base: 'overridablevalue',
        quote: 'USDT-6D8',
        overrides: {
          binance_dex: {
            overridablevalue: 'BUSD-BD1',
          },
        },
      },
    }

    it('should return success for override', async () => {
      mockRateResponseSuccess()

      const response = await req
        .post('/')
        .send(dataWithOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('rate api with invalid symbol', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'NON',
        quote: 'EXISTING',
      },
    }

    it('should return failure', async () => {
      mockRateResponseFailure()

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
