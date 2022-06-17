import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockNftResponseSuccess, mockRateResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
    process.env.NFT_API_ENDPOINT = process.env.NFT_API_ENDPOINT || 'http://fake-nft.endpoint'
    process.env.NFT_API_AUTH_HEADER = process.env.NFT_API_AUTH_HEADER || 'fake-nft-auth-header'
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

  describe('exchange rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BTC',
        quote: 'USD',
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
  })

  describe('nft-floor-price api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'nft-floor-price',
        network: 'ethereum-mainnet',
        contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        start: '2022-05-25T12:00:00.000Z',
        end: '2022-05-25T12:00:00.000Z',
      },
    }

    it('should return success', async () => {
      mockNftResponseSuccess()

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
