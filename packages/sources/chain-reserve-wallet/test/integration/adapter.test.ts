import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockCustodialAddressesResponse } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

describe('chain-reserve-wallet', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL || 'test-rpc-url'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
  })

  afterAll((done) => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('when making a request to fetch the contract addresses', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        chainID: 0,
        contractAddress: '0xAe1932a83DeD75db2afD1E4EC6c0D4241554100A',
      },
    }

    it('is successful', async () => {
      mockCustodialAddressesResponse()

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
