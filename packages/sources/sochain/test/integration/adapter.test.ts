import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('balance api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          {
            address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
            coin: 'btc',
          },
          {
            address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
            coin: 'btc',
          },
        ],
        dataPath: 'addresses',
        confirmations: 3,
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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
