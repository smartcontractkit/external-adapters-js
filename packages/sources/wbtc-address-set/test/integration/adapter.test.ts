import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockAddressesResponseSuccess, mockMembersResponseSuccess } from './fixtures'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.MEMBERS_ENDPOINT = process.env.MEMBERS_ENDPOINT || 'http://localhost:8081'
    process.env.ADDRESSES_ENDPOINT = process.env.ADDRESSES_ENDPOINT || 'http://localhost:8082'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
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

  describe('members api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'members',
      },
    }

    it('should return success', async () => {
      mockMembersResponseSuccess()

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

  describe('addresses api', () => {
    const data: AdapterRequest = {
      id,
      data: {},
    }

    it('should return success', async () => {
      mockAddressesResponseSuccess()

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
